const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Content = require("../models/Content");
const Order = require("../models/Order");
const upload = require("../middleware/upload");
const { requireAdmin, redirectIfLoggedIn } = require("../middleware/auth");

const asArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

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
