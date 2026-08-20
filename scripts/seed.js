require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Content = require("../models/Content");
const AppointmentForm = require("../models/AppointmentForm");

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ruqyah_landing";
  await mongoose.connect(uri);
  console.log("[seed] connected to", uri);

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  let admin = await Admin.findOne({ username });
  if (!admin) {
    const passwordHash = await Admin.hashPassword(password);
    admin = await Admin.create({ username, passwordHash });
    console.log(`[seed] Created admin user -> username: "${username}", password: "${password}"`);
    console.log("[seed] Please change this password after first login (Admin panel > Account).");
  } else {
    console.log(`[seed] Admin user "${username}" already exists, skipping.`);
  }

  const existingContent = await Content.findOne();
  if (!existingContent) {
    await Content.create({});
    console.log("[seed] Created initial landing page content with defaults.");
  } else {
    console.log("[seed] Content document already exists, skipping.");
  }

  const existingForm = await AppointmentForm.findOne();
  if (!existingForm) {
    await AppointmentForm.getSingleton();
    console.log("[seed] Created initial appointment form with default sections/fields.");
  } else {
    console.log("[seed] Appointment form already exists, skipping.");
  }

  await mongoose.disconnect();
  console.log("[seed] Done.");
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
