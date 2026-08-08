const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    hadiya: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    deliveryLabel: { type: String, default: "" },
    total: { type: Number, default: 0 }
  },
  { timestamps: true }
);

OrderSchema.index({ phone: 1 });

module.exports = mongoose.model("Order", OrderSchema);
