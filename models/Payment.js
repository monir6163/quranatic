const mongoose = require("mongoose");
const { Schema } = mongoose;

/* Payment ledger — the source of truth for every UddoktaPay transaction.

   One document per charge attempt, linked to the record it pays for
   (a hand appointment, appointment, or order) via (targetType, targetId).
   The gateway does not return an invoice id at charge-creation time, so we
   correlate the later callbacks back to this row through
   metadata.payment_ref = this document's _id. `amount` is the amount we asked
   for and is the anchor we verify the gateway's reported amount against. */
const PaymentSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["HandAppointment", "Appointment", "Order"],
      required: true
    },
    targetId: { type: Schema.Types.ObjectId, required: true },

    amount: { type: Number, required: true }, // expected amount (verification anchor)
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "ERROR", "CANCELED"],
      default: "PENDING",
      index: true
    },

    // Filled in when the gateway reports back (redirect return / webhook).
    invoiceId: { type: String, default: "", index: true },
    transactionId: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    senderNumber: { type: String, default: "" },
    gatewayAmount: { type: Number, default: 0 },

    raw: { type: Schema.Types.Mixed }, // last verify-payment response snapshot
    paidAt: { type: Date }
  },
  { timestamps: true }
);

PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
