const express = require("express");
const router = express.Router();
const Content = require("../models/Content");
const Order = require("../models/Order");
const AppointmentForm = require("../models/AppointmentForm");
const Appointment = require("../models/Appointment");

function toList(raw) {
  return (raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

router.get("/", async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("index", {
      content,
      heroBullets: toList(content.hero.bulletsRaw),
      wrongWays: toList(content.solution.wrongWaysRaw),
      struggleItems: toList(content.whyUs.struggleItemsRaw),
      oursItems: toList(content.whyUs.oursItemsRaw),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/appointment", async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const form = await AppointmentForm.getSingleton();
    res.render("appointment", { content, form });
  } catch (err) {
    next(err);
  }
});

const BD_PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/api/orders", async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      hadiya,
      deliveryCharge,
      deliveryLabel,
      total,
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "")
      .trim()
      .replace(/[\s-]/g, "");
    const cleanAddress = String(address || "").trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ ok: false, message: "সঠিক নাম দিন।" });
    }
    if (!BD_PHONE_RE.test(cleanPhone)) {
      return res
        .status(400)
        .json({ ok: false, message: "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।" });
    }
    if (!cleanAddress || cleanAddress.length < 5) {
      return res
        .status(400)
        .json({ ok: false, message: "সম্পূর্ণ ঠিকানা দিন।" });
    }

    const cleanHadiya = Math.max(0, parseInt(hadiya, 10) || 0);
    const cleanDeliveryCharge = Math.max(0, parseInt(deliveryCharge, 10) || 0);
    if (![70, 130].includes(cleanDeliveryCharge)) {
      return res
        .status(400)
        .json({ ok: false, message: "সঠিক ডেলিভারি এলাকা নির্বাচন করুন।" });
    }

    const order = await Order.create({
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      hadiya: cleanHadiya,
      deliveryCharge: cleanDeliveryCharge,
      deliveryLabel: deliveryLabel || "",
      total: cleanHadiya + cleanDeliveryCharge,
    });
    res.json({ ok: true, id: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "সার্ভারে সমস্যা হয়েছে।" });
  }
});

const CHOICE_TYPES = ["select", "radio", "checkbox-group"];

// Human-readable label for a chosen option value, in the submission language.
function optionDisplay(field, val, lang) {
  const opt = (field.options || []).find((o) => o.value === val);
  if (!opt) return String(val || "");
  return lang === "en" ? opt.labelEn || opt.labelBn : opt.labelBn || opt.labelEn;
}

router.post("/api/appointments", async (req, res) => {
  try {
    const lang = req.body.language === "en" ? "en" : "bn";
    const t = (bn, en) => (lang === "en" ? en : bn);

    // Honeypot: silently accept (don't store) obvious bots.
    if (String(req.body.website || "").trim() !== "") {
      return res.json({ ok: true });
    }

    const form = await AppointmentForm.getSingleton();
    const values = req.body.values && typeof req.body.values === "object" ? req.body.values : {};

    const answers = [];
    const errors = {};

    form.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === "note") return;
        const key = field.key;
        const raw = values[key];
        let value = "";

        switch (field.type) {
          case "checkbox-group": {
            const arr = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
            const valid = arr.filter((v) => (field.options || []).some((o) => o.value === v));
            if (field.required && valid.length === 0) errors[key] = t("অন্তত একটি নির্বাচন করুন।", "Select at least one.");
            value = valid.map((v) => optionDisplay(field, v, lang));
            break;
          }
          case "checkbox": {
            const checked = raw === true || raw === "true" || raw === "on" || raw === "1";
            if (field.required && !checked) errors[key] = t("এই ঘরটি চিহ্নিত করুন।", "Please check this box.");
            value = checked ? t("হ্যাঁ", "Yes") : t("না", "No");
            break;
          }
          case "select":
          case "radio": {
            const v = String(raw == null ? "" : raw).trim();
            if (v && !(field.options || []).some((o) => o.value === v)) {
              errors[key] = t("সঠিক অপশন নির্বাচন করুন।", "Select a valid option.");
            }
            if (field.required && !v) errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            value = v ? optionDisplay(field, v, lang) : "";
            break;
          }
          case "tel": {
            const v = String(raw == null ? "" : raw).trim().replace(/[\s-]/g, "");
            if (field.required && !v) errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && !BD_PHONE_RE.test(v)) errors[key] = t("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।", "Enter a valid 11-digit mobile number.");
            value = v;
            break;
          }
          case "email": {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v) errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && !EMAIL_RE.test(v)) errors[key] = t("সঠিক ইমেইল ঠিকানা দিন।", "Enter a valid email address.");
            value = v;
            break;
          }
          case "number": {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v) errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && isNaN(Number(v))) errors[key] = t("সঠিক সংখ্যা দিন।", "Enter a valid number.");
            value = v;
            break;
          }
          default: {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v) errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            value = v;
          }
        }

        answers.push({ key, labelBn: field.labelBn, labelEn: field.labelEn, type: field.type, value });
      });
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({
        ok: false,
        message: t("দয়া করে চিহ্নিত ঘরগুলো ঠিক করুন।", "Please fix the highlighted fields."),
        errors
      });
    }

    await Appointment.create({ language: lang, answers });
    res.json({ ok: true, message: lang === "en" ? form.successEn : form.successBn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "সার্ভারে সমস্যা হয়েছে।" });
  }
});

module.exports = router;
