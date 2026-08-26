// ---------- Hand appointment: image preview + validation + submit ----------
(function () {
  const wrap = document.querySelector(".js-hand-wrap");
  if (!wrap) return;

  const form = wrap.querySelector(".js-hand-form");
  if (!form) return;

  const gateway = form.dataset.paymentMode === "gateway";
  const BD_PHONE_RE = /^01[3-9]\d{8}$/;

  const submitBtn = form.querySelector(".js-hand-submit");
  const submitError = form.querySelector(".js-hand-submit-error");
  const successBox = wrap.querySelector(".js-hand-success");
  const fields = form.querySelectorAll(".hand-field");

  const fieldByName = (name) => form.querySelector('.hand-field[data-field="' + name + '"]');
  const errorEl = (field) => (field ? field.querySelector(".hand-error") : null);

  function setError(field, msg) {
    if (!field) return;
    const el = errorEl(field);
    if (el) {
      el.textContent = msg;
      el.classList.remove("hidden");
    }
    field.querySelectorAll("input, textarea, select").forEach((c) => {
      if (c.type !== "radio" && c.type !== "checkbox" && c.type !== "file") c.classList.add("!border-clay");
    });
  }
  function clearError(field) {
    if (!field) return;
    const el = errorEl(field);
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
    field.querySelectorAll("input, textarea, select").forEach((c) => c.classList.remove("!border-clay"));
  }

  /* ---- live image previews ---- */
  form.querySelectorAll(".js-hand-file").forEach((input) => {
    const drop = input.closest(".js-hand-drop");
    const preview = drop && drop.querySelector(".js-hand-preview");
    const placeholder = drop && drop.querySelector(".js-hand-placeholder");
    const field = input.closest(".hand-field");

    input.addEventListener("change", () => {
      clearError(field);
      const file = input.files && input.files[0];
      if (file && preview) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
        if (placeholder) placeholder.classList.add("hidden");
      } else if (preview) {
        preview.removeAttribute("src");
        preview.classList.add("hidden");
        if (placeholder) placeholder.classList.remove("hidden");
      }
    });
  });

  /* ---- value readers ---- */
  function readText(name) {
    const field = fieldByName(name);
    if (!field) return "";
    const radio = field.querySelector('input[type="radio"]:checked');
    if (radio) return radio.value;
    if (field.querySelector('input[type="radio"]')) return ""; // radio group with nothing chosen
    const ctrl = field.querySelector("input, textarea, select");
    return ctrl ? ctrl.value.trim() : "";
  }
  function hasFile(name) {
    const field = fieldByName(name);
    const input = field && field.querySelector('input[type="file"]');
    return !!(input && input.files && input.files.length);
  }

  function validate() {
    let valid = true;
    fields.forEach(clearError);

    const name = readText("name");
    const phone = readText("phone").replace(/[\s-]/g, "");
    const paymentMethod = readText("paymentMethod");
    const transactionId = readText("transactionId");
    const senderNumber = readText("senderNumber").replace(/[\s-]/g, "");

    const fail = (n, msg) => { setError(fieldByName(n), msg); valid = false; };

    if (name.length < 2) fail("name", "সঠিক নাম দিন।");
    if (!BD_PHONE_RE.test(phone)) fail("phone", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
    if (!hasFile("rightHand")) fail("rightHand", "ডান হাতের ছবি আপলোড করুন।");
    if (!hasFile("leftHand")) fail("leftHand", "বাম হাতের ছবি আপলোড করুন।");
    // Manual payment proof is only required when the online gateway is off.
    if (!gateway) {
      if (!paymentMethod) fail("paymentMethod", "পেমেন্ট মাধ্যম নির্বাচন করুন।");
      if (!transactionId) fail("transactionId", "ট্রানজেকশন আইডি দিন।");
      if (!BD_PHONE_RE.test(senderNumber)) fail("senderNumber", "সঠিক ১১ ডিজিটের নম্বর দিন।");
    }

    return valid;
  }

  function scrollToFirstError() {
    const firstBad = form.querySelector(".hand-error:not(.hidden)");
    if (firstBad) firstBad.closest(".hand-field").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitError.classList.add("hidden");
    submitError.textContent = "";

    if (!validate()) {
      scrollToFirstError();
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");
    submitBtn.textContent = "জমা হচ্ছে...";

    const restore = () => {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      submitBtn.textContent = originalText;
    };

    try {
      const res = await fetch("/api/hand-appointments", { method: "POST", body: new FormData(form) });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (data && data.errors) {
          Object.keys(data.errors).forEach((key) => setError(fieldByName(key), data.errors[key]));
        }
        submitError.textContent = (data && data.message) || "জমা দেওয়া যায়নি। আবার চেষ্টা করুন।";
        submitError.classList.remove("hidden");
        restore();
        scrollToFirstError();
        return;
      }

      // Gateway mode: server returns a payment URL — go pay, don't show success yet.
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      form.classList.add("hidden");
      successBox.classList.remove("hidden");
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      submitError.textContent = "ইন্টারনেট সংযোগ সমস্যা। আবার চেষ্টা করুন।";
      submitError.classList.remove("hidden");
      restore();
    }
  });
})();
