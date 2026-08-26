const mongoose = require("mongoose");
const { Schema } = mongoose;

/* Singleton content config for the public /hand-appointment page.
   Everything the visitor sees is editable here from the admin panel. */
const HandAppointmentPageSchema = new Schema(
  {
    title: { type: String, default: "হাতের ছবি অ্যাপয়েন্টমেন্ট" },
    description: {
      type: String,
      default:
        "নিচের ফর্মটি পূরণ করে আপনার ডান ও বাম হাতের স্পষ্ট ছবি আপলোড করুন এবং নির্ধারিত হাদিয়া পরিশোধ করে আবেদন জমা দিন। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব ইনশাআল্লাহ।"
    },
    instructions: {
      type: String,
      default:
        "পরিষ্কার আলোতে হাতের তালুর দিক থেকে ছবি তুলুন।\nছবি যেন স্পষ্ট ও ঝাপসামুক্ত হয়।\nডান হাত ও বাম হাতের আলাদা আলাদা ছবি আপলোড করুন।"
    },

    // Charge / hadiya
    charge: { type: Number, default: 500 },

    // Payment mode: 'manual' collects a bKash/Nagad proof (default, unchanged);
    // 'gateway' redirects to the online payment gateway after the form is submitted.
    paymentMode: { type: String, enum: ["manual", "gateway"], default: "manual" },

    // Payment (proof collected)
    paymentNumber: { type: String, default: "01820500346" },
    paymentMethodsRaw: { type: String, default: "বিকাশ\nনগদ" },
    paymentInstructions: {
      type: String,
      default:
        "উপরের নম্বরে বিকাশ / নগদ এর মাধ্যমে হাদিয়া সেন্ড মানি করুন, তারপর ট্রানজেকশন আইডি ও যে নম্বর থেকে পাঠিয়েছেন তা নিচে লিখুন।"
    },

    // Field labels (editable)
    nameLabel: { type: String, default: "আপনার নাম" },
    phoneLabel: { type: String, default: "মোবাইল নম্বর" },
    rightHandLabel: { type: String, default: "ডান হাতের ছবি" },
    leftHandLabel: { type: String, default: "বাম হাতের ছবি" },
    paymentMethodLabel: { type: String, default: "পেমেন্ট মাধ্যম" },
    trxIdLabel: { type: String, default: "ট্রানজেকশন আইডি (TrxID)" },
    senderNumberLabel: { type: String, default: "যে নম্বর থেকে পাঠিয়েছেন" },

    submitText: { type: String, default: "আবেদন জমা দিন" },
    successMessage: {
      type: String,
      default:
        "ধন্যবাদ! আপনার আবেদনটি সফলভাবে জমা হয়েছে। আমরা পেমেন্ট যাচাই করে শীঘ্রই যোগাযোগ করব ইনশাআল্লাহ।"
    }
  },
  { timestamps: true }
);

HandAppointmentPageSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model("HandAppointmentPage", HandAppointmentPageSchema);
