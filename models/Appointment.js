const mongoose = require("mongoose");
const { Schema } = mongoose;

/* A snapshot of one answer at submit time. Labels/type are copied in so the
   submission stays readable even if the form definition is later changed. */
const AnswerSchema = new Schema(
  {
    key: { type: String, default: "" },
    labelBn: { type: String, default: "" },
    labelEn: { type: String, default: "" },
    type: { type: String, default: "text" },
    value: { type: Schema.Types.Mixed, default: "" } // String, or [String] for checkbox-group
  },
  { _id: false }
);

const AppointmentSchema = new Schema(
  {
    language: { type: String, enum: ["bn", "en"], default: "bn" },
    answers: { type: [AnswerSchema], default: [] },
    paid: { type: Boolean, default: false } // set true once an online payment is verified
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
