const express = require("express");
const router = express.Router();
const Content = require("../models/Content");
const Order = require("../models/Order");

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
      oursItems: toList(content.whyUs.oursItemsRaw)
    });
  } catch (err) {
    next(err);
  }
});

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

router.post("/api/orders", async (req, res) => {
  try {
    const { name, phone, address, hadiya, deliveryCharge, deliveryLabel, total } = req.body;

    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "").trim().replace(/[\s-]/g, "");
    const cleanAddress = String(address || "").trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ ok: false, message: "সঠিক নাম দিন।" });
    }
    if (!BD_PHONE_RE.test(cleanPhone)) {
      return res.status(400).json({ ok: false, message: "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।" });
    }
    if (!cleanAddress || cleanAddress.length < 5) {
      return res.status(400).json({ ok: false, message: "সম্পূর্ণ ঠিকানা দিন।" });
    }

    const cleanHadiya = Math.max(0, parseInt(hadiya, 10) || 0);
    const cleanDeliveryCharge = Math.max(0, parseInt(deliveryCharge, 10) || 0);
    if (![70, 130].includes(cleanDeliveryCharge)) {
      return res.status(400).json({ ok: false, message: "সঠিক ডেলিভারি এলাকা নির্বাচন করুন।" });
    }

    const order = await Order.create({
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      hadiya: cleanHadiya,
      deliveryCharge: cleanDeliveryCharge,
      deliveryLabel: deliveryLabel || "",
      total: cleanHadiya + cleanDeliveryCharge
    });
    res.json({ ok: true, id: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "সার্ভারে সমস্যা হয়েছে।" });
  }
});

module.exports = router;
