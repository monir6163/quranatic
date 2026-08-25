const mongoose = require("mongoose");
const { Schema } = mongoose;

/* One hand-appointment submission. `charge` is snapshotted at submit time so
   later edits to the page's charge never rewrite the value an applicant saw. */
const HandAppointmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    rightHandImage: { type: String, default: "" },
    leftHandImage: { type: String, default: "" },
    charge: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    transactionId: { type: String, default: "", trim: true },
    senderNumber: { type: String, default: "", trim: true },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

HandAppointmentSchema.index({ phone: 1 });

module.exports = mongoose.model("HandAppointment", HandAppointmentSchema);
