// ---------- Appointment form: bilingual toggle + validation + submit ----------
(function () {
  const wrap = document.querySelector(".js-appt-wrap");
  if (!wrap) return;

  const form = wrap.querySelector(".js-appt-form");
  const langButtons = wrap.querySelectorAll(".js-lang-btn");

  const BD_PHONE_RE = /^01[3-9]\d{8}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getLang = () => (wrap.dataset.lang === "en" ? "en" : "bn");
  const t = (bn, en) => (getLang() === "en" ? en : bn);

  /* ---- language toggle ---- */
  function applyLang(lang) {
    wrap.dataset.lang = lang;

    langButtons.forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("bg-primary-600", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("shadow", active);
      btn.classList.toggle("text-ink/60", !active);
    });

    // swap placeholders (single-attribute, can't be dual-span)
    wrap.querySelectorAll("[data-ph-bn]").forEach((el) => {
      el.placeholder = lang === "en" ? el.dataset.phEn || "" : el.dataset.phBn || "";
    });

    // swap <option> text
    wrap.querySelectorAll("select option").forEach((opt) => {
      if (opt.dataset.bn !== undefined || opt.dataset.en !== undefined) {
        opt.textContent = lang === "en" ? opt.dataset.en || "" : opt.dataset.bn || "";
      }
    });
  }

  langButtons.forEach((btn) => btn.addEventListener("click", () => applyLang(btn.dataset.lang)));
  applyLang(getLang());

  if (!form) return;

  const fields = form.querySelectorAll(".appt-field");
  const submitBtn = form.querySelector(".js-appt-submit");
  const submitError = form.querySelector(".js-appt-submit-error");
  const fieldsBox = form.querySelector(".js-appt-fields");
  const successBox = form.querySelector(".js-appt-success");

  function errorEl(field) {
    return field.querySelector(".appt-error");
  }
  function controls(field) {
    return field.querySelectorAll("input, textarea, select");
  }
  function setError(field, msg) {
    const el = errorEl(field);
    if (el) {
      el.textContent = msg;
      el.classList.remove("hidden");
    }
    controls(field).forEach((c) => {
      if (c.type !== "radio" && c.type !== "checkbox") c.classList.add("!border-clay");
    });
  }
  function clearError(field) {
    const el = errorEl(field);
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
    controls(field).forEach((c) => c.classList.remove("!border-clay"));
  }

  // Read the value(s) for one field wrapper based on its type.
  function readValue(field) {
    const type = field.dataset.type;
    if (type === "checkbox") {
      const cb = field.querySelector('input[type="checkbox"]');
      return cb ? cb.checked : false;
    }
    if (type === "checkbox-group") {
      return [...field.querySelectorAll('input[type="checkbox"]:checked')].map((c) => c.value);
    }
    if (type === "radio") {
      const r = field.querySelector('input[type="radio"]:checked');
      return r ? r.value : "";
    }
    const ctrl = field.querySelector("input, textarea, select");
    return ctrl ? ctrl.value.trim() : "";
  }

  function validate(values) {
    let valid = true;
    fields.forEach((field) => {
      clearError(field);
      const type = field.dataset.type;
      const required = field.dataset.required === "1";
      const val = readValue(field);
      values[field.dataset.key] = val;

      const isEmpty =
        type === "checkbox" ? val !== true : type === "checkbox-group" ? val.length === 0 : val === "";

      if (required && isEmpty) {
        setError(field, type === "checkbox" ? t("এই ঘরটি চিহ্নিত করুন।", "Please check this box.") : t("এই তথ্যটি আবশ্যক।", "This field is required."));
        valid = false;
        return;
      }
      if (type === "tel" && val && !BD_PHONE_RE.test(val.replace(/[\s-]/g, ""))) {
        setError(field, t("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।", "Enter a valid 11-digit mobile number."));
        valid = false;
      } else if (type === "email" && val && !EMAIL_RE.test(val)) {
        setError(field, t("সঠিক ইমেইল ঠিকানা দিন।", "Enter a valid email address."));
        valid = false;
      } else if (type === "number" && val && isNaN(Number(val))) {
        setError(field, t("সঠিক সংখ্যা দিন।", "Enter a valid number."));
        valid = false;
      }
    });
    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitError.classList.add("hidden");
    submitError.textContent = "";

    const values = {};
    if (!validate(values)) {
      const firstBad = form.querySelector(".appt-error:not(.hidden)");
      if (firstBad) firstBad.closest(".appt-field").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");
    submitBtn.textContent = t("জমা হচ্ছে...", "Submitting...");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: getLang(), values, website: "" })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // map server-side field errors back onto the form
        if (data && data.errors) {
          Object.keys(data.errors).forEach((key) => {
            const field = form.querySelector('.appt-field[data-key="' + key + '"]');
            if (field) setError(field, data.errors[key]);
          });
        }
        submitError.textContent = (data && data.message) || t("জমা দেওয়া যায়নি। আবার চেষ্টা করুন।", "Could not submit. Please try again.");
        submitError.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
        submitBtn.innerHTML = originalHTML;
        return;
      }

      fieldsBox.classList.add("hidden");
      successBox.classList.remove("hidden");
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      submitError.textContent = t("ইন্টারনেট সংযোগ সমস্যা। আবার চেষ্টা করুন।", "Network problem. Please try again.");
      submitError.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      submitBtn.innerHTML = originalHTML;
    }
  });
})();
