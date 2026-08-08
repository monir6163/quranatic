function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    res.locals.adminUsername = req.session.adminUsername;
    return next();
  }
  req.flash("error", "অনুগ্রহ করে প্রথমে লগইন করুন।");
  return res.redirect("/admin/login");
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect("/admin");
  }
  next();
}

module.exports = { requireAdmin, redirectIfLoggedIn };
