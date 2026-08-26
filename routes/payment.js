const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const { apiKeyMatches } = require("../services/uddoktapay");
const { settleFromInvoice } = require("../lib/paymentFlow");

/* Browser lands here after checkout. With return_type=GET the gateway appends
   ?invoice_id=...; we ignore anything the browser claims and verify server-side. */
router.get("/return", handleReturn);
router.post("/return", handleReturn);

async function handleReturn(req, res) {
  const invoiceId = req.query.invoice_id || (req.body && req.body.invoice_id) || "";
  let status = "failed";
  let record = null;
  try {
    record = await settleFromInvoice(invoiceId);
    if (record && record.status === "COMPLETED") status = "success";
    else if (record && record.status === "PENDING") status = "pending";
  } catch (err) {
    console.error("[payment] return verify failed:", err.message);
  }
  res.status(200).render("payment-result", { status, record });
}

/* Server-to-server IPN. Authenticate the API-key header (constant-time), then
   re-verify server-side. Return 500 only on a transient error so the gateway
   can retry; 200 once we've settled/recorded it. */
router.post("/webhook", async (req, res) => {
  if (!apiKeyMatches(req.headers["rt-uddoktapay-api-key"])) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }
  try {
    const invoiceId = (req.body && req.body.invoice_id) || "";
    await settleFromInvoice(invoiceId);
    return res.status(200).json({ status: true });
  } catch (err) {
    console.error("[payment] webhook error:", err.message);
    return res.status(500).json({ status: false });
  }
});

/* User canceled at the gateway. */
router.get("/cancel", async (req, res) => {
  const ref = req.query.ref;
  try {
    if (ref && /^[0-9a-fA-F]{24}$/.test(String(ref))) {
      await Payment.updateOne({ _id: ref, status: "PENDING" }, { $set: { status: "CANCELED" } });
    }
  } catch (err) {
    console.error("[payment] cancel error:", err.message);
  }
  res.status(200).render("payment-cancel");
});

module.exports = router;
