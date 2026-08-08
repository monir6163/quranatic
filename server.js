require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const methodOverride = require("method-override");

const connectDB = require("./config/db");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ruqyah_landing";

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret-in-env",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
  })
);
app.use(flash());

// Make flash + current path available to every view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use("/admin", adminRoutes);
app.use("/", publicRoutes);

// 404
app.use((req, res) => {
  res.status(404).send("পেজটি খুঁজে পাওয়া যায়নি (404)");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("সার্ভারে সমস্যা হয়েছে। " + (process.env.NODE_ENV !== "production" ? err.message : ""));
});

app.listen(PORT, () => {
  console.log(`[server] Running at http://localhost:${PORT}`);
});
