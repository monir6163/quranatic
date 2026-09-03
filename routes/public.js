const express = require("express");
const fs = require("fs");
const router = express.Router();
const Content = require("../models/Content");
const Order = require("../models/Order");
const AppointmentForm = require("../models/AppointmentForm");
const Appointment = require("../models/Appointment");
const HandAppointmentPage = require("../models/HandAppointmentPage");
const HandAppointment = require("../models/HandAppointment");
const upload = require("../middleware/upload");
const { startCharge } = require("../lib/paymentFlow");

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

router.get("/hand-appointment", async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const page = await HandAppointmentPage.getSingleton();
    res.render("hand-appointment", {
      content,
      page,
      methods: toList(page.paymentMethodsRaw),
    });
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
    // test er jonno 5 tk hobe
    const cleanHadiya = Math.max(0, parseInt(hadiya, 10) || 0);
    const cleanDeliveryCharge = Math.max(0, parseInt(deliveryCharge, 10) || 0);
    if (![70, 130].includes(cleanDeliveryCharge)) {
      return res
        .status(400)
        .json({ ok: false, message: "সঠিক ডেলিভারি এলাকা নির্বাচন করুন।" });
    }

    const orderData = {
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      hadiya: cleanHadiya,
      deliveryCharge: cleanDeliveryCharge,
      deliveryLabel: deliveryLabel || "",
      total: cleanHadiya + cleanDeliveryCharge,
    };

    // Online payment mode → open a gateway charge WITHOUT saving the order yet.
    // The order is created only after payment is verified, so a canceled/abandoned
    // payment never lands in the admin panel. COD (default) saves immediately.
    const content = await Content.getSingleton();
    if (
      content.siteSettings.orderPaymentMode === "gateway" &&
      orderData.total > 0
    ) {
      try {
        const { payment_url } = await startCharge({
          req,
          targetType: "Order",
          pendingData: orderData,
          amount: orderData.total,
          fullName: cleanName,
          phone: cleanPhone,
        });
        return res.json({ ok: true, payment_url });
      } catch (e) {
        return res.status(502).json({
          ok: false,
          message: e.message || "পেমেন্ট শুরু করা যায়নি।",
        });
      }
    }

    const order = await Order.create(orderData);
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
  return lang === "en"
    ? opt.labelEn || opt.labelBn
    : opt.labelBn || opt.labelEn;
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
    const values =
      req.body.values && typeof req.body.values === "object"
        ? req.body.values
        : {};

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
            const arr = Array.isArray(raw)
              ? raw.map(String)
              : raw
                ? [String(raw)]
                : [];
            const valid = arr.filter((v) =>
              (field.options || []).some((o) => o.value === v),
            );
            if (field.required && valid.length === 0)
              errors[key] = t(
                "অন্তত একটি নির্বাচন করুন।",
                "Select at least one.",
              );
            value = valid.map((v) => optionDisplay(field, v, lang));
            break;
          }
          case "checkbox": {
            const checked =
              raw === true || raw === "true" || raw === "on" || raw === "1";
            if (field.required && !checked)
              errors[key] = t(
                "এই ঘরটি চিহ্নিত করুন।",
                "Please check this box.",
              );
            value = checked ? t("হ্যাঁ", "Yes") : t("না", "No");
            break;
          }
          case "select":
          case "radio": {
            const v = String(raw == null ? "" : raw).trim();
            if (v && !(field.options || []).some((o) => o.value === v)) {
              errors[key] = t(
                "সঠিক অপশন নির্বাচন করুন।",
                "Select a valid option.",
              );
            }
            if (field.required && !v)
              errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            value = v ? optionDisplay(field, v, lang) : "";
            break;
          }
          case "tel": {
            const v = String(raw == null ? "" : raw)
              .trim()
              .replace(/[\s-]/g, "");
            if (field.required && !v)
              errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && !BD_PHONE_RE.test(v))
              errors[key] = t(
                "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।",
                "Enter a valid 11-digit mobile number.",
              );
            value = v;
            break;
          }
          case "email": {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v)
              errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && !EMAIL_RE.test(v))
              errors[key] = t(
                "সঠিক ইমেইল ঠিকানা দিন।",
                "Enter a valid email address.",
              );
            value = v;
            break;
          }
          case "number": {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v)
              errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            else if (v && isNaN(Number(v)))
              errors[key] = t("সঠিক সংখ্যা দিন।", "Enter a valid number.");
            value = v;
            break;
          }
          default: {
            const v = String(raw == null ? "" : raw).trim();
            if (field.required && !v)
              errors[key] = t("এই তথ্যটি আবশ্যক।", "This field is required.");
            value = v;
          }
        }

        answers.push({
          key,
          labelBn: field.labelBn,
          labelEn: field.labelEn,
          type: field.type,
          value,
        });
      });
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({
        ok: false,
        message: t(
          "দয়া করে চিহ্নিত ঘরগুলো ঠিক করুন।",
          "Please fix the highlighted fields.",
        ),
        errors,
      });
    }

    // Online payment mode → charge form.charge and redirect to the gateway WITHOUT
    // saving the appointment yet; it is created only after payment is verified.
    // When disabled (default) the appointment is saved now (inline success message).
    if (form.paymentEnabled && form.charge > 0) {
      const strAnswer = (a) =>
        a && typeof a.value === "string" ? a.value.trim() : "";
      const telAns = answers.find((a) => a.type === "tel" && strAnswer(a));
      const emailAns = answers.find((a) => a.type === "email" && strAnswer(a));
      const nameAns =
        answers.find(
          (a) => a.type === "text" && /name/i.test(a.key) && strAnswer(a),
        ) || answers.find((a) => a.type === "text" && strAnswer(a));
      try {
        const { payment_url } = await startCharge({
          req,
          targetType: "Appointment",
          pendingData: { language: lang, answers },
          amount: form.charge,
          fullName: nameAns ? strAnswer(nameAns) : "",
          email: emailAns ? strAnswer(emailAns) : "",
          phone: telAns ? strAnswer(telAns) : "",
        });
        return res.json({ ok: true, payment_url });
      } catch (e) {
        return res.status(502).json({
          ok: false,
          message:
            e.message ||
            t("পেমেন্ট শুরু করা যায়নি।", "Could not start payment."),
        });
      }
    }

    await Appointment.create({ language: lang, answers });
    res.json({
      ok: true,
      message: lang === "en" ? form.successEn : form.successBn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "সার্ভারে সমস্যা হয়েছে।" });
  }
});

/* ---- Hand appointment: two image uploads + payment proof ---- */
const handUpload = upload.fields([
  { name: "rightHand", maxCount: 1 },
  { name: "leftHand", maxCount: 1 },
]);

router.post("/api/hand-appointments", (req, res) => {
  handUpload(req, res, async (uploadErr) => {
    const files =
      (req.files &&
        [].concat(req.files.rightHand || [], req.files.leftHand || [])) ||
      [];
    const cleanupUploads = () =>
      files.forEach((f) => f && fs.unlink(f.path, () => {}));

    try {
      if (uploadErr) {
        cleanupUploads();
        return res.status(400).json({
          ok: false,
          message: uploadErr.message || "ছবি আপলোডে সমস্যা হয়েছে।",
        });
      }

      const page = await HandAppointmentPage.getSingleton();
      const methods = toList(page.paymentMethodsRaw);

      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "")
        .trim()
        .replace(/[\s-]/g, "");
      const paymentMethod = String(req.body.paymentMethod || "").trim();
      const transactionId = String(req.body.transactionId || "").trim();
      const senderNumber = String(req.body.senderNumber || "")
        .trim()
        .replace(/[\s-]/g, "");

      const rightFile =
        req.files && req.files.rightHand && req.files.rightHand[0];
      const leftFile = req.files && req.files.leftHand && req.files.leftHand[0];

      const gateway = page.paymentMode === "gateway";

      const errors = {};
      if (!name || name.length < 2) errors.name = "সঠিক নাম দিন।";
      if (!BD_PHONE_RE.test(phone))
        errors.phone = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।";
      if (!rightFile) errors.rightHand = "ডান হাতের ছবি আপলোড করুন।";
      if (!leftFile) errors.leftHand = "বাম হাতের ছবি আপলোড করুন।";
      // Manual proof (method / TrxID / sender number) is only required when the gateway is off.
      if (!gateway) {
        if (methods.length && !methods.includes(paymentMethod))
          errors.paymentMethod = "পেমেন্ট মাধ্যম নির্বাচন করুন।";
        if (!transactionId) errors.transactionId = "ট্রানজেকশন আইডি দিন।";
        if (!BD_PHONE_RE.test(senderNumber))
          errors.senderNumber = "সঠিক ১১ ডিজিটের নম্বর দিন।";
      }

      if (Object.keys(errors).length) {
        cleanupUploads();
        return res.status(400).json({
          ok: false,
          message: "দয়া করে চিহ্নিত ঘরগুলো ঠিক করুন।",
          errors,
        });
      }

      const rightHandImage = `/uploads/${rightFile.filename}`;
      const leftHandImage = `/uploads/${leftFile.filename}`;

      // Gateway mode → open a charge and redirect WITHOUT saving the submission yet;
      // it is created (verified) only after payment is confirmed, so an abandoned
      // payment never appears in the admin panel. The uploaded images stay on disk
      // and are attached to the record on success.
      if (gateway) {
        try {
          const { payment_url } = await startCharge({
            req,
            targetType: "HandAppointment",
            pendingData: {
              name,
              phone,
              rightHandImage,
              leftHandImage,
              charge: page.charge,
            },
            amount: page.charge,
            fullName: name,
            phone,
          });
          return res.json({ ok: true, payment_url });
        } catch (e) {
          cleanupUploads(); // no record will be created — don't leave orphan files
          return res.status(502).json({
            ok: false,
            message: e.message || "পেমেন্ট শুরু করা যায়নি।",
          });
        }
      }

      // Manual mode → save the submission now, with its payment proof.
      await HandAppointment.create({
        name,
        phone,
        rightHandImage,
        leftHandImage,
        charge: page.charge,
        paymentMethod,
        transactionId,
        senderNumber,
      });

      res.json({ ok: true, message: page.successMessage });
    } catch (err) {
      console.error(err);
      cleanupUploads();
      res.status(500).json({ ok: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
  });
});

module.exports = router;
