const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Admin = require("../models/Admin");
const Content = require("../models/Content");
const Order = require("../models/Order");
const AppointmentForm = require("../models/AppointmentForm");
const Appointment = require("../models/Appointment");
const HandAppointmentPage = require("../models/HandAppointmentPage");
const HandAppointment = require("../models/HandAppointment");
const upload = require("../middleware/upload");
const { requireAdmin, redirectIfLoggedIn } = require("../middleware/auth");

const asArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

// Best-effort removal of an uploaded file given its stored "/uploads/x" path.
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
function removeUpload(storedPath) {
  if (!storedPath) return;
  fs.unlink(path.join(UPLOAD_DIR, path.basename(storedPath)), () => {});
}

/* ---- Appointment form-builder definition helpers ---- */
const FIELD_TYPES = [
  "text", "textarea", "number", "email", "tel", "date",
  "select", "radio", "checkbox", "checkbox-group", "note"
];
const FIELD_WIDTHS = ["full", "half", "third"];
const CHOICE_TYPES = ["select", "radio", "checkbox-group"];

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// Validate + normalise the JSON definition posted by the builder UI.
function sanitizeDefinition(raw) {
  const def = raw && typeof raw === "object" ? raw : {};
  const usedKeys = new Set();
  let counter = 0;
  const makeKey = (preferred) => {
    const base = slugify(preferred) || "field";
    let key = base;
    while (usedKeys.has(key)) {
      counter += 1;
      key = base + "_" + counter;
    }
    usedKeys.add(key);
    return key;
  };

  const sections = (Array.isArray(def.sections) ? def.sections : [])
    .map((sec) => {
      const s = sec && typeof sec === "object" ? sec : {};
      const fields = (Array.isArray(s.fields) ? s.fields : [])
        .map((f) => {
          const fld = f && typeof f === "object" ? f : {};
          const type = FIELD_TYPES.includes(fld.type) ? fld.type : "text";
          const width = FIELD_WIDTHS.includes(fld.width) ? fld.width : "full";
          const labelBn = String(fld.labelBn || "").trim();
          const labelEn = String(fld.labelEn || "").trim();

          let options = [];
          if (CHOICE_TYPES.includes(type)) {
            options = (Array.isArray(fld.options) ? fld.options : [])
              .map((o) => {
                const opt = o && typeof o === "object" ? o : {};
                const oBn = String(opt.labelBn || "").trim();
                const oEn = String(opt.labelEn || "").trim();
                let value = String(opt.value || "").trim();
                if (!value) value = slugify(oEn || oBn) || "option";
                return { value, labelBn: oBn, labelEn: oEn };
              })
              .filter((o) => o.labelBn || o.labelEn);
          }

          return {
            key: makeKey(String(fld.key || "").trim() || labelEn || labelBn),
            type, labelBn, labelEn,
            placeholderBn: String(fld.placeholderBn || "").trim(),
            placeholderEn: String(fld.placeholderEn || "").trim(),
            required: !!fld.required,
            width, options
          };
        })
        .filter((f) => {
          if (!(f.labelBn || f.labelEn)) return false; // must have a label
          if (CHOICE_TYPES.includes(f.type) && f.options.length === 0) return false;
          return true;
        });

      return {
        titleBn: String(s.titleBn || "").trim(),
        titleEn: String(s.titleEn || "").trim(),
        fields
      };
    })
    .filter((s) => s.titleBn || s.titleEn || s.fields.length);

  return {
    titleBn: String(def.titleBn || "").trim(),
    titleEn: String(def.titleEn || "").trim(),
    descriptionBn: String(def.descriptionBn || "").trim(),
    descriptionEn: String(def.descriptionEn || "").trim(),
    submitTextBn: String(def.submitTextBn || "").trim(),
    submitTextEn: String(def.submitTextEn || "").trim(),
    successBn: String(def.successBn || "").trim(),
    successEn: String(def.successEn || "").trim(),
    defaultLang: def.defaultLang === "en" ? "en" : "bn",
    sections
  };
}

/* ---------------- AUTH ---------------- */

router.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("admin/login", { layout: false });
});

router.post("/login", redirectIfLoggedIn, async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username: (username || "").trim() });
    if (!admin || !(await admin.checkPassword(password || ""))) {
      req.flash("error", "ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।");
      return res.redirect("/admin/login");
    }
    req.session.adminId = admin._id.toString();
    req.session.adminUsername = admin.username;
    req.flash("success", "সফলভাবে লগইন হয়েছে।");
    res.redirect("/admin");
  } catch (err) {
    req.flash("error", "লগইন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
    res.redirect("/admin/login");
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

/* ---------------- DASHBOARD ---------------- */

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/dashboard", { content, active: "dashboard" });
  } catch (err) {
    next(err);
  }
});

/* ---------------- ORDERS ---------------- */

router.get("/orders", requireAdmin, async (req, res, next) => {
  try {
    const phone = (req.query.phone || "").trim();
    const filter = phone
      ? { phone: { $regex: phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.render("admin/orders", { orders, phone, active: "orders" });
  } catch (err) {
    next(err);
  }
});

router.post("/orders/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    req.flash("success", "অর্ডার মুছে ফেলা হয়েছে।");
    const phone = (req.body.phone || "").trim();
    res.redirect("/admin/orders" + (phone ? "?phone=" + encodeURIComponent(phone) : ""));
  } catch (err) {
    next(err);
  }
});

/* ---------------- APPOINTMENT FORM BUILDER ---------------- */

router.get("/appointment-form", requireAdmin, async (req, res, next) => {
  try {
    const form = await AppointmentForm.getSingleton();
    res.render("admin/appointment-form", { form, active: "appointmentForm" });
  } catch (err) {
    next(err);
  }
});

router.post("/appointment-form", requireAdmin, async (req, res, next) => {
  try {
    const form = await AppointmentForm.getSingleton();
    let parsed;
    try {
      parsed = JSON.parse(req.body.definition || "{}");
    } catch (e) {
      req.flash("error", "ফর্ম সংরক্ষণ ব্যর্থ হয়েছে (ডেটা ত্রুটিপূর্ণ)।");
      return res.redirect("/admin/appointment-form");
    }
    form.set(sanitizeDefinition(parsed));
    await form.save();
    req.flash("success", "অ্যাপয়েন্টমেন্ট ফর্ম আপডেট হয়েছে।");
    res.redirect("/admin/appointment-form");
  } catch (err) {
    next(err);
  }
});

/* ---------------- APPOINTMENT SUBMISSIONS ---------------- */

router.get("/appointments", requireAdmin, async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = q
      ? { "answers.value": { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      : {};
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.render("admin/appointments", { appointments, q, active: "appointments" });
  } catch (err) {
    next(err);
  }
});

router.get("/appointments/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      req.flash("error", "আবেদনটি পাওয়া যায়নি।");
      return res.redirect("/admin/appointments");
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      req.flash("error", "আবেদনটি পাওয়া যায়নি।");
      return res.redirect("/admin/appointments");
    }
    res.render("admin/appointment-detail", { appointment, active: "appointments" });
  } catch (err) {
    next(err);
  }
});

router.post("/appointments/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    req.flash("success", "আবেদনটি মুছে ফেলা হয়েছে।");
    const q = (req.body.q || "").trim();
    res.redirect("/admin/appointments" + (q ? "?q=" + encodeURIComponent(q) : ""));
  } catch (err) {
    next(err);
  }
});

/* ---------------- HAND APPOINTMENT PAGE (content) ---------------- */

router.get("/hand-appointment-page", requireAdmin, async (req, res, next) => {
  try {
    const page = await HandAppointmentPage.getSingleton();
    res.render("admin/hand-appointment-page", { page, active: "handAppointmentPage" });
  } catch (err) {
    next(err);
  }
});

router.post("/hand-appointment-page", requireAdmin, async (req, res, next) => {
  try {
    const page = await HandAppointmentPage.getSingleton();
    const b = req.body;
    Object.assign(page, {
      title: b.title,
      description: b.description,
      instructions: b.instructions,
      charge: Math.max(0, parseInt(b.charge, 10) || 0),
      paymentNumber: b.paymentNumber,
      paymentMethodsRaw: b.paymentMethodsRaw,
      paymentInstructions: b.paymentInstructions,
      nameLabel: b.nameLabel,
      phoneLabel: b.phoneLabel,
      rightHandLabel: b.rightHandLabel,
      leftHandLabel: b.leftHandLabel,
      paymentMethodLabel: b.paymentMethodLabel,
      trxIdLabel: b.trxIdLabel,
      senderNumberLabel: b.senderNumberLabel,
      submitText: b.submitText,
      successMessage: b.successMessage
    });
    await page.save();
    req.flash("success", "হাত অ্যাপয়েন্টমেন্ট পেজ আপডেট হয়েছে।");
    res.redirect("/admin/hand-appointment-page");
  } catch (err) {
    next(err);
  }
});

/* ---------------- HAND APPOINTMENT SUBMISSIONS ---------------- */

router.get("/hand-appointments", requireAdmin, async (req, res, next) => {
  try {
    const phone = (req.query.phone || "").trim();
    const filter = phone
      ? { phone: { $regex: phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      : {};
    const submissions = await HandAppointment.find(filter).sort({ createdAt: -1 });
    res.render("admin/hand-appointments", { submissions, phone, active: "handAppointments" });
  } catch (err) {
    next(err);
  }
});

router.get("/hand-appointments/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      req.flash("error", "আবেদনটি পাওয়া যায়নি।");
      return res.redirect("/admin/hand-appointments");
    }
    const submission = await HandAppointment.findById(req.params.id);
    if (!submission) {
      req.flash("error", "আবেদনটি পাওয়া যায়নি।");
      return res.redirect("/admin/hand-appointments");
    }
    res.render("admin/hand-appointment-detail", { submission, active: "handAppointments" });
  } catch (err) {
    next(err);
  }
});

router.post("/hand-appointments/:id/toggle", requireAdmin, async (req, res, next) => {
  try {
    const submission = await HandAppointment.findById(req.params.id);
    if (submission) {
      submission.verified = !submission.verified;
      await submission.save();
      req.flash("success", submission.verified ? "পেমেন্ট যাচাইকৃত হিসেবে চিহ্নিত হয়েছে।" : "যাচাই বাতিল করা হয়েছে।");
    }
    res.redirect("/admin/hand-appointments/" + req.params.id);
  } catch (err) {
    next(err);
  }
});

router.post("/hand-appointments/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    const submission = await HandAppointment.findById(req.params.id);
    if (submission) {
      removeUpload(submission.rightHandImage);
      removeUpload(submission.leftHandImage);
      await submission.deleteOne();
    }
    req.flash("success", "আবেদনটি মুছে ফেলা হয়েছে।");
    const phone = (req.body.phone || "").trim();
    res.redirect("/admin/hand-appointments" + (phone ? "?phone=" + encodeURIComponent(phone) : ""));
  } catch (err) {
    next(err);
  }
});

/* ---------------- SITE SETTINGS ---------------- */

router.get("/settings", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/settings", { content, active: "settings" });
  } catch (err) {
    next(err);
  }
});

router.post("/settings", requireAdmin, upload.single("logo"), async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const b = req.body;
    Object.assign(content.siteSettings, {
      siteName: b.siteName,
      tagline: b.tagline,
      badge: b.badge,
      phone: b.phone,
      whatsapp: b.whatsapp,
      duration: b.duration,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink
    });
    if (req.file) {
      content.siteSettings.logo = `/uploads/${req.file.filename}`;
    }
    await content.save();
    req.flash("success", "সাইট সেটিংস আপডেট হয়েছে।");
    res.redirect("/admin/settings");
  } catch (err) {
    next(err);
  }
});

/* ---------------- HERO ---------------- */

router.get("/hero", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/hero", { content, active: "hero" });
  } catch (err) {
    next(err);
  }
});

router.post("/hero", requireAdmin, upload.single("videoThumbnail"), async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const b = req.body;
    Object.assign(content.hero, {
      eyebrow: b.eyebrow,
      titleBeforeHighlight: b.titleBeforeHighlight,
      titleHighlight: b.titleHighlight,
      description: b.description,
      bulletsRaw: b.bulletsRaw,
      videoUrl: b.videoUrl
    });
    if (req.file) {
      content.hero.videoThumbnail = `/uploads/${req.file.filename}`;
    }
    await content.save();
    req.flash("success", "হিরো সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/hero");
  } catch (err) {
    next(err);
  }
});

/* ---------------- PROBLEMS ---------------- */

router.get("/problems", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/problems", { content, active: "problems" });
  } catch (err) {
    next(err);
  }
});

router.post("/problems", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const titles = asArray(req.body.title);
    const descriptions = asArray(req.body.description);
    content.problems.eyebrow = req.body.eyebrow;
    content.problems.heading = req.body.heading;
    content.problems.items = titles
      .map((title, i) => ({ title: title.trim(), description: (descriptions[i] || "").trim() }))
      .filter((item) => item.title || item.description);
    await content.save();
    req.flash("success", "সমস্যা সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/problems");
  } catch (err) {
    next(err);
  }
});

/* ---------------- SOLUTION ---------------- */

router.get("/solution", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/solution", { content, active: "solution" });
  } catch (err) {
    next(err);
  }
});

router.post("/solution", requireAdmin, upload.array("images", 6), async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const b = req.body;
    Object.assign(content.solution, {
      eyebrow: b.eyebrow,
      heading: b.heading,
      wrongWaysHeading: b.wrongWaysHeading,
      wrongWaysRaw: b.wrongWaysRaw,
      note: b.note
    });
    if (req.files && req.files.length) {
      const newPaths = req.files.map((f) => `/uploads/${f.filename}`);
      content.solution.images = [...(content.solution.images || []), ...newPaths];
    }
    await content.save();
    req.flash("success", "সমাধান সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/solution");
  } catch (err) {
    next(err);
  }
});

router.post("/solution/image/:index/delete", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const idx = parseInt(req.params.index, 10);
    if (!Number.isNaN(idx) && content.solution.images[idx] !== undefined) {
      content.solution.images.splice(idx, 1);
      await content.save();
    }
    res.redirect("/admin/solution");
  } catch (err) {
    next(err);
  }
});

/* ---------------- WHY US ---------------- */

router.get("/why-us", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/why-us", { content, active: "whyUs" });
  } catch (err) {
    next(err);
  }
});

router.post("/why-us", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const b = req.body;
    Object.assign(content.whyUs, {
      heading: b.heading,
      subheading: b.subheading,
      struggleTitle: b.struggleTitle,
      struggleItemsRaw: b.struggleItemsRaw,
      struggleBoxText: b.struggleBoxText,
      oursTitle: b.oursTitle,
      oursItemsRaw: b.oursItemsRaw,
      oursNote: b.oursNote
    });
    await content.save();
    req.flash("success", "'কেন আলাদা' সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/why-us");
  } catch (err) {
    next(err);
  }
});

/* ---------------- FAQ ---------------- */

router.get("/faq", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/faq", { content, active: "faq" });
  } catch (err) {
    next(err);
  }
});

router.post("/faq", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const questions = asArray(req.body.question);
    const answers = asArray(req.body.answer);
    content.faq.eyebrow = req.body.eyebrow;
    content.faq.heading = req.body.heading;
    content.faq.items = questions
      .map((question, i) => ({ question: question.trim(), answer: (answers[i] || "").trim() }))
      .filter((item) => item.question || item.answer);
    await content.save();
    req.flash("success", "প্রশ্নোত্তর সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/faq");
  } catch (err) {
    next(err);
  }
});

/* ---------------- TESTIMONIALS ---------------- */

router.get("/testimonials", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/testimonials", { content, active: "testimonials" });
  } catch (err) {
    next(err);
  }
});

router.post("/testimonials", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    const names = asArray(req.body.name);
    const texts = asArray(req.body.text);
    content.testimonials.heading = req.body.heading;
    content.testimonials.subheading = req.body.subheading;
    content.testimonials.items = names
      .map((name, i) => ({ name: name.trim(), text: (texts[i] || "").trim(), avatar: "" }))
      .filter((item) => item.name || item.text);
    await content.save();
    req.flash("success", "রিভিউ সেকশন আপডেট হয়েছে।");
    res.redirect("/admin/testimonials");
  } catch (err) {
    next(err);
  }
});

/* ---------------- FOOTER ---------------- */

router.get("/footer", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    res.render("admin/footer", { content, active: "footer" });
  } catch (err) {
    next(err);
  }
});

router.post("/footer", requireAdmin, async (req, res, next) => {
  try {
    const content = await Content.getSingleton();
    Object.assign(content.footer, {
      about: req.body.about,
      note: req.body.note,
      copyrightText: req.body.copyrightText
    });
    await content.save();
    req.flash("success", "ফুটার আপডেট হয়েছে।");
    res.redirect("/admin/footer");
  } catch (err) {
    next(err);
  }
});

/* ---------------- ACCOUNT (change password) ---------------- */

router.get("/account", requireAdmin, (req, res) => {
  res.render("admin/account", { active: "account" });
});

router.post("/account", requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const admin = await Admin.findById(req.session.adminId);
    if (!admin || !(await admin.checkPassword(currentPassword || ""))) {
      req.flash("error", "বর্তমান পাসওয়ার্ড সঠিক নয়।");
      return res.redirect("/admin/account");
    }
    if (!newPassword || newPassword.length < 6) {
      req.flash("error", "নতুন পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে।");
      return res.redirect("/admin/account");
    }
    if (newPassword !== confirmPassword) {
      req.flash("error", "নতুন পাসওয়ার্ড দুইবার একই দিতে হবে।");
      return res.redirect("/admin/account");
    }
    admin.passwordHash = await Admin.hashPassword(newPassword);
    await admin.save();
    req.flash("success", "পাসওয়ার্ড পরিবর্তন হয়েছে।");
    res.redirect("/admin/account");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
