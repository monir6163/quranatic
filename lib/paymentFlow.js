const payment = require("../config/payment");
const { createCharge, verifyPayment } = require("../services/uddoktapay");
const Payment = require("../models/Payment");
const HandAppointment = require("../models/HandAppointment");
const Appointment = require("../models/Appointment");
const Order = require("../models/Order");

/* The reusable payment engine shared by all three flows and by the return /
   webhook routes. Security lives here: charges are created server-side, and a
   payment is only ever fulfilled after a server-to-server verify confirms
   status COMPLETED with a matching amount, exactly once. */

/* Absolute origin for gateway callbacks. Prefer the configured PUBLIC_URL — the
   webhook must be reachable by UddoktaPay's servers — and fall back to the
   request origin for the browser-facing redirect/cancel URLs. */
function originFrom(req) {
  if (payment.publicUrl) return payment.publicUrl;
  return `${req.protocol}://${req.get("host")}`;
}

/* Create a PENDING Payment and open a gateway charge for it.
   Returns { payment_url, paymentId }; throws on any failure (caller returns a
   JSON error to the client). */
async function startCharge({ req, targetType, targetDoc, amount, fullName, email, phone }) {
  if (!payment.isConfigured) throw new Error("পেমেন্ট গেটওয়ে কনফিগার করা হয়নি।");

  const amt = Math.round(Number(amount) || 0);
  if (!(amt > 0)) throw new Error("অবৈধ পেমেন্ট পরিমাণ।");

  const record = await Payment.create({
    targetType,
    targetId: targetDoc._id,
    amount: amt,
    fullName: fullName || "",
    email: email || "",
    phone: phone || ""
  });

  const origin = originFrom(req);
  let resp;
  try {
    resp = await createCharge({
      full_name: fullName || "Customer",
      email: email || `pay-${record._id}@ruqyah.local`,
      amount: String(amt),
      metadata: { payment_ref: record._id.toString(), target_type: targetType },
      redirect_url: `${origin}/payment/return`,
      cancel_url: `${origin}/payment/cancel?ref=${record._id}`,
      webhook_url: `${origin}/payment/webhook`,
      return_type: "GET"
    });
  } catch (err) {
    record.status = "ERROR";
    record.raw = { error: err.message };
    await record.save();
    throw new Error("পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।");
  }

  if (!resp || resp.status !== true || !resp.payment_url) {
    record.status = "ERROR";
    record.raw = resp;
    await record.save();
    throw new Error((resp && resp.message) || "পেমেন্ট শুরু করা যায়নি।");
  }

  return { payment_url: resp.payment_url, paymentId: record._id };
}

/* Verify one invoice server-side and, if it is genuinely COMPLETED for the
   expected amount, atomically settle the Payment and mark its target paid.
   Idempotent: safe to call from both the redirect return and the webhook, and
   safe to call repeatedly. Returns the Payment, or null if the invoice can't be
   resolved to one of ours. */
async function settleFromInvoice(invoiceId) {
  if (!invoiceId) return null;

  const data = await verifyPayment(invoiceId);
  const ref = data && data.metadata && data.metadata.payment_ref;
  if (!ref || !/^[0-9a-fA-F]{24}$/.test(String(ref))) return null;

  const record = await Payment.findById(ref);
  if (!record) return null;
  if (record.status === "COMPLETED") return record; // already fulfilled

  const gatewayAmount = Math.round(parseFloat(data.amount) || 0);
  const statusOk = String(data.status || "").toUpperCase() === "COMPLETED";
  const amountOk = gatewayAmount === Math.round(record.amount);

  if (!statusOk || !amountOk) {
    // Record what we saw, but do NOT fulfill.
    record.invoiceId = String(data.invoice_id || invoiceId);
    record.gatewayAmount = gatewayAmount;
    record.raw = data;
    if (String(data.status || "").toUpperCase() === "ERROR") record.status = "ERROR";
    await record.save();
    if (statusOk && !amountOk) {
      console.error(
        `[payment] amount mismatch on ${record._id}: expected ${record.amount}, gateway ${gatewayAmount} — not fulfilling`
      );
    }
    return record;
  }

  // Atomic PENDING -> COMPLETED. Only the caller that wins this update applies
  // the side effect, so a simultaneous webhook + return can't double-fulfill.
  const settled = await Payment.findOneAndUpdate(
    { _id: record._id, status: "PENDING" },
    {
      $set: {
        status: "COMPLETED",
        invoiceId: String(data.invoice_id || invoiceId),
        transactionId: String(data.transaction_id || ""),
        paymentMethod: String(data.payment_method || ""),
        senderNumber: String(data.sender_number || ""),
        gatewayAmount,
        raw: data,
        paidAt: new Date()
      }
    },
    { new: true }
  );

  if (settled) {
    await applyPaid(settled);
    return settled;
  }
  return Payment.findById(record._id); // lost the race; already handled
}

/* Mark the linked target record as paid. */
async function applyPaid(record) {
  try {
    if (record.targetType === "HandAppointment") {
      await HandAppointment.updateOne({ _id: record.targetId }, { $set: { verified: true } });
    } else if (record.targetType === "Appointment") {
      await Appointment.updateOne({ _id: record.targetId }, { $set: { paid: true } });
    } else if (record.targetType === "Order") {
      await Order.updateOne({ _id: record.targetId }, { $set: { paid: true } });
    }
  } catch (err) {
    console.error("[payment] applyPaid failed:", err.message);
  }
}

module.exports = { startCharge, settleFromInvoice, applyPaid, originFrom };
