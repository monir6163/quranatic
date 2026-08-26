const mongoose = require("mongoose");
const { Schema } = mongoose;

/* One selectable option for choice fields (select / radio / checkbox-group) */
const OptionSchema = new Schema(
  {
    value: { type: String, default: "" },
    labelBn: { type: String, default: "" },
    labelEn: { type: String, default: "" }
  },
  { _id: false }
);

/* A single form field */
const FieldSchema = new Schema(
  {
    key: { type: String, default: "" }, // stable identifier used when storing answers
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "email",
        "tel",
        "date",
        "select",
        "radio",
        "checkbox", // single yes/no
        "checkbox-group", // multiple choice
        "note" // display-only bilingual text
      ],
      default: "text"
    },
    labelBn: { type: String, default: "" },
    labelEn: { type: String, default: "" },
    placeholderBn: { type: String, default: "" },
    placeholderEn: { type: String, default: "" },
    required: { type: Boolean, default: false },
    width: { type: String, enum: ["full", "half", "third"], default: "full" },
    options: { type: [OptionSchema], default: [] }
  },
  { _id: false }
);

/* A group of fields under one heading */
const SectionSchema = new Schema(
  {
    titleBn: { type: String, default: "" },
    titleEn: { type: String, default: "" },
    fields: { type: [FieldSchema], default: [] }
  },
  { _id: false }
);

const DIVISION_OPTIONS = [
  { value: "dhaka", labelBn: "ঢাকা", labelEn: "Dhaka" },
  { value: "chattogram", labelBn: "চট্টগ্রাম", labelEn: "Chattogram" },
  { value: "rajshahi", labelBn: "রাজশাহী", labelEn: "Rajshahi" },
  { value: "khulna", labelBn: "খুলনা", labelEn: "Khulna" },
  { value: "barishal", labelBn: "বরিশাল", labelEn: "Barishal" },
  { value: "sylhet", labelBn: "সিলেট", labelEn: "Sylhet" },
  { value: "rangpur", labelBn: "রংপুর", labelEn: "Rangpur" },
  { value: "mymensingh", labelBn: "ময়মনসিংহ", labelEn: "Mymensingh" }
];

/* Checkbox that reveals the permanent-address section on the public form. */
const ADD_PERMANENT_ADDRESS_FIELD = {
  key: "add_permanent_address",
  type: "checkbox",
  labelBn: "স্থায়ী ঠিকানা যোগ করুন",
  labelEn: "Add permanent address",
  width: "full"
};

/* Permanent address mirrors the present-address fields (keys prefixed "perm_").
   A factory so a fresh copy can be spliced into an already-seeded document. */
function permanentAddressSection() {
  return {
    titleBn: "স্থায়ী ঠিকানা",
    titleEn: "Permanent Address",
    fields: [
      {
        key: "same_address",
        type: "checkbox",
        labelBn: "স্থায়ী ও বর্তমান ঠিকানা একই",
        labelEn: "Permanent and present address are the same",
        width: "full"
      },
      {
        key: "perm_division",
        type: "select",
        labelBn: "বিভাগ",
        labelEn: "Division",
        placeholderBn: "বিভাগ নির্বাচন করুন",
        placeholderEn: "Select a division",
        width: "third",
        options: DIVISION_OPTIONS
      },
      { key: "perm_district", type: "text", labelBn: "জেলা", labelEn: "District", width: "third" },
      { key: "perm_upazila", type: "text", labelBn: "উপজেলা / থানা", labelEn: "Upazila / Thana", width: "third" },
      { key: "perm_union_ward", type: "text", labelBn: "ইউনিয়ন / ওয়ার্ড", labelEn: "Union / Ward", width: "third" },
      { key: "perm_village", type: "text", labelBn: "গ্রাম / এলাকা", labelEn: "Village / Area", width: "third" },
      { key: "perm_house_road", type: "text", labelBn: "বাসা ও রোড নম্বর", labelEn: "House & Road No.", width: "third" }
    ]
  };
}

/* Default (seeded) form roughly matching the appointment-form mockup.
   Admin can freely add / edit / remove any of this from the panel. */
const DEFAULT_SECTIONS = [
  {
    titleBn: "আবেদনকারীর তথ্য",
    titleEn: "Applicant Information",
    fields: [
      {
        key: "applicant_name",
        type: "text",
        labelBn: "আবেদনকারীর নাম",
        labelEn: "Applicant Name",
        placeholderBn: "আপনার পূর্ণ নাম লিখুন",
        placeholderEn: "Enter your full name",
        required: true,
        width: "half"
      },
      {
        key: "phone",
        type: "tel",
        labelBn: "মোবাইল নম্বর",
        labelEn: "Mobile Number",
        placeholderBn: "01XXXXXXXXX",
        placeholderEn: "01XXXXXXXXX",
        required: true,
        width: "half"
      }
    ]
  },
  {
    titleBn: "জাতীয় পরিচয়পত্র তথ্য",
    titleEn: "National ID Information",
    fields: [
      {
        key: "nid_name",
        type: "text",
        labelBn: "নাম (এনআইডি অনুযায়ী)",
        labelEn: "Name (as per NID)",
        width: "third"
      },
      {
        key: "father_name",
        type: "text",
        labelBn: "পিতার নাম",
        labelEn: "Father's Name",
        width: "third"
      },
      {
        key: "mother_name",
        type: "text",
        labelBn: "মাতার নাম",
        labelEn: "Mother's Name",
        width: "third"
      },
      {
        key: "nid_number",
        type: "text",
        labelBn: "জাতীয় পরিচয়পত্র নম্বর",
        labelEn: "National ID Number",
        width: "half"
      },
      {
        key: "dob",
        type: "date",
        labelBn: "জন্ম তারিখ",
        labelEn: "Date of Birth",
        width: "half"
      }
    ]
  },
  {
    titleBn: "বর্তমান ঠিকানা",
    titleEn: "Present Address",
    fields: [
      {
        key: "division",
        type: "select",
        labelBn: "বিভাগ",
        labelEn: "Division",
        placeholderBn: "বিভাগ নির্বাচন করুন",
        placeholderEn: "Select a division",
        width: "third",
        options: DIVISION_OPTIONS
      },
      {
        key: "district",
        type: "text",
        labelBn: "জেলা",
        labelEn: "District",
        width: "third"
      },
      {
        key: "upazila",
        type: "text",
        labelBn: "উপজেলা / থানা",
        labelEn: "Upazila / Thana",
        width: "third"
      },
      {
        key: "union_ward",
        type: "text",
        labelBn: "ইউনিয়ন / ওয়ার্ড",
        labelEn: "Union / Ward",
        width: "third"
      },
      {
        key: "village",
        type: "text",
        labelBn: "গ্রাম / এলাকা",
        labelEn: "Village / Area",
        width: "third"
      },
      {
        key: "house_road",
        type: "text",
        labelBn: "বাসা ও রোড নম্বর",
        labelEn: "House & Road No.",
        width: "third"
      },
      ADD_PERMANENT_ADDRESS_FIELD
    ]
  },
  permanentAddressSection(),
  {
    titleBn: "সমস্যার বিবরণ",
    titleEn: "Problem Details",
    fields: [
      {
        key: "gender",
        type: "radio",
        labelBn: "লিঙ্গ",
        labelEn: "Gender",
        width: "half",
        options: [
          { value: "male", labelBn: "পুরুষ", labelEn: "Male" },
          { value: "female", labelBn: "মহিলা", labelEn: "Female" }
        ]
      },
      {
        key: "symptoms",
        type: "checkbox-group",
        labelBn: "উপসর্গসমূহ (একাধিক নির্বাচন করা যাবে)",
        labelEn: "Symptoms (you may select multiple)",
        width: "half",
        options: [
          { value: "anxiety", labelBn: "দুশ্চিন্তা / অস্থিরতা", labelEn: "Anxiety / restlessness" },
          { value: "sleep", labelBn: "ঘুমের সমস্যা", labelEn: "Sleep problems" },
          { value: "waswas", labelBn: "ওয়াসওয়াসা", labelEn: "Waswas (intrusive thoughts)" },
          { value: "physical", labelBn: "শারীরিক সমস্যা", labelEn: "Physical issues" }
        ]
      },
      {
        key: "problem",
        type: "textarea",
        labelBn: "সমস্যার বিস্তারিত বিবরণ",
        labelEn: "Detailed description of the problem",
        placeholderBn: "আপনার সমস্যাটি বিস্তারিত লিখুন...",
        placeholderEn: "Describe your problem in detail...",
        required: true,
        width: "full"
      },
      {
        key: "duration",
        type: "textarea",
        labelBn: "কত দিন ধরে এই অবস্থা?",
        labelEn: "How long have you had this condition?",
        width: "half"
      },
      {
        key: "prev_treatment",
        type: "textarea",
        labelBn: "পূর্বে কোথাও চিকিৎসা নিয়েছেন কি?",
        labelEn: "Have you taken any treatment before?",
        width: "half"
      }
    ]
  },
  {
    titleBn: "যোগাযোগ তথ্য",
    titleEn: "Contact Information",
    fields: [
      {
        key: "contact_note",
        type: "note",
        labelBn:
          "সরাসরি হটলাইন / জরুরি প্রয়োজনে কল করুন: 01820500346\nআবেদন জমা দেওয়ার পর আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব ইনশাআল্লাহ।",
        labelEn:
          "Direct hotline / for urgent needs call: 01820500346\nAfter you submit, we will contact you soon in shaa Allah.",
        width: "full"
      }
    ]
  }
];

const AppointmentFormSchema = new Schema(
  {
    titleBn: { type: String, default: "আবেদন / অ্যাপয়েন্টমেন্ট ফর্ম" },
    titleEn: { type: String, default: "Application / Appointment Form" },
    descriptionBn: {
      type: String,
      default: "নিচের ফর্মটি পূরণ করে আপনার আবেদন জমা দিন। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।"
    },
    descriptionEn: {
      type: String,
      default: "Fill out the form below to submit your application. We will contact you soon."
    },
    submitTextBn: { type: String, default: "আবেদন জমা দিন" },
    submitTextEn: { type: String, default: "Submit Application" },
    successBn: {
      type: String,
      default: "ধন্যবাদ! আপনার আবেদনটি সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব ইনশাআল্লাহ।"
    },
    successEn: {
      type: String,
      default: "Thank you! Your application has been submitted successfully. We will contact you soon."
    },
    defaultLang: { type: String, enum: ["bn", "en"], default: "bn" },

    // Online payment. Kept out of the JSON builder save (sanitizeDefinition never
    // emits these keys), so they survive `form.set(sanitizeDefinition(...))` and
    // are edited through their own admin route instead.
    paymentEnabled: { type: Boolean, default: false },
    charge: { type: Number, default: 500 },

    sections: { type: [SectionSchema], default: DEFAULT_SECTIONS }
  },
  { timestamps: true }
);

AppointmentFormSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    return this.create({});
  }

  // Backfill: split a legacy single "Address" section into present + permanent
  // with the add/same toggles. Idempotent, runs once per form.
  const hasToggle = doc.sections.some((s) => s.fields.some((f) => f.key === "add_permanent_address"));
  const hasPerm = doc.sections.some((s) => s.fields.some((f) => f.key === "perm_division"));
  if (!hasToggle || !hasPerm) {
    const idx = doc.sections.findIndex((s) => s.fields.some((f) => f.key === "division"));
    if (idx !== -1) {
      const present = doc.sections[idx];
      present.titleBn = "বর্তমান ঠিকানা";
      present.titleEn = "Present Address";
      // drop the legacy "same" checkbox from the present block, ensure the toggle is last
      present.fields = present.fields.filter((f) => f.key !== "same_address" && f.key !== "add_permanent_address");
      present.fields.push({ ...ADD_PERMANENT_ADDRESS_FIELD });
      if (!hasPerm) doc.sections.splice(idx + 1, 0, permanentAddressSection());
      doc.markModified("sections");
      await doc.save();
    }
  }
  return doc;
};

module.exports = mongoose.model("AppointmentForm", AppointmentFormSchema);
