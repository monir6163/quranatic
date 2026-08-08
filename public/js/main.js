// ---------- Scroll reveal ----------
(function () {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => observer.observe(el));
})();

// ---------- FAQ accordion (cards start collapsed on mobile-friendly toggle) ----------
(function () {
  const cards = document.querySelectorAll(".faq-card");
  cards.forEach((card) => {
    const answer = card.querySelector(".faq-answer");
    const toggle = card.querySelector(".faq-toggle");
    card.addEventListener("click", () => {
      const isOpen = card.classList.toggle("faq-open");
      if (toggle) toggle.style.transform = isOpen ? "rotate(45deg)" : "rotate(0deg)";
      if (answer) answer.style.display = "block"; // content is always readable; toggle only rotates icon
    });
  });
})();

// ---------- Testimonial slider ----------
(function () {
  const slides = document.querySelectorAll(".testimonial-slide");
  if (!slides.length) return;
  const dots = document.querySelectorAll("#testimonialDots .dot");
  const prevBtn = document.getElementById("testimonialPrev");
  const nextBtn = document.getElementById("testimonialNext");
  let current = 0;

  function show(index) {
    slides.forEach((s, i) => s.classList.toggle("hidden", i !== index));
    dots.forEach((d, i) => {
      d.classList.toggle("bg-primary-600", i === index);
      d.classList.toggle("bg-primary-200", i !== index);
    });
    current = index;
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      show((current - 1 + slides.length) % slides.length);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      show((current + 1) % slides.length);
    });
  }
  dots.forEach((dot) => {
    dot.addEventListener("click", () => show(parseInt(dot.dataset.index, 10)));
  });

  if (slides.length > 1) {
    setInterval(() => show((current + 1) % slides.length), 6000);
  }
})();

// ---------- Order form: live total + validated backend submit ----------
(function () {
  const form = document.getElementById("orderForm");
  if (!form) return;

  const nameInput = document.getElementById("orderName");
  const phoneInput = document.getElementById("orderPhone");
  const addressInput = document.getElementById("orderAddress");
  const hadiyaInput = document.getElementById("orderHadiya");
  const deliveryInputs = form.querySelectorAll(".orderDelivery");
  const totalEl = document.getElementById("orderTotal");
  const submitBtn = document.getElementById("orderSubmitBtn");
  const submitError = document.getElementById("orderSubmitError");
  const successBox = document.getElementById("orderSuccess");
  const fieldsBox = document.getElementById("orderFields");

  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  function toBangla(num) {
    return String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
  }

  function getDeliveryCharge() {
    const checked = form.querySelector(".orderDelivery:checked");
    return checked ? parseInt(checked.value, 10) || 0 : 0;
  }

  function updateTotal() {
    const hadiya = Math.max(0, parseInt(hadiyaInput.value, 10) || 0);
    const total = hadiya + getDeliveryCharge();
    totalEl.textContent = "৳" + toBangla(total);
    return total;
  }

  if (hadiyaInput) hadiyaInput.addEventListener("input", updateTotal);
  deliveryInputs.forEach((el) => el.addEventListener("change", updateTotal));
  updateTotal();

  function showFieldError(input, message) {
    const wrap = input.closest("div");
    const errorEl = wrap ? wrap.querySelector(".orderError") : null;
    input.classList.add("!border-clay");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
  }

  function clearFieldError(input) {
    const wrap = input.closest("div");
    const errorEl = wrap ? wrap.querySelector(".orderError") : null;
    input.classList.remove("!border-clay");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
  }

  function clearAllErrors() {
    [nameInput, phoneInput, addressInput, hadiyaInput].forEach(clearFieldError);
    submitError.classList.add("hidden");
    submitError.textContent = "";
  }

  // Bangladeshi mobile number: 11 digits, starts with 01, 3rd digit 3-9
  const BD_PHONE_RE = /^01[3-9]\d{8}$/;

  function validate() {
    clearAllErrors();
    let valid = true;

    const name = nameInput.value.trim();
    if (!name) {
      showFieldError(nameInput, "নাম আবশ্যক।");
      valid = false;
    } else if (name.length < 2) {
      showFieldError(nameInput, "সঠিক নাম লিখুন।");
      valid = false;
    }

    const phoneRaw = phoneInput.value.trim().replace(/[\s-]/g, "");
    if (!phoneRaw) {
      showFieldError(phoneInput, "ফোন নাম্বার আবশ্যক।");
      valid = false;
    } else if (!BD_PHONE_RE.test(phoneRaw)) {
      showFieldError(phoneInput, "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।");
      valid = false;
    }

    const address = addressInput.value.trim();
    if (!address) {
      showFieldError(addressInput, "ঠিকানা আবশ্যক।");
      valid = false;
    } else if (address.length < 5) {
      showFieldError(addressInput, "সম্পূর্ণ ঠিকানা লিখুন।");
      valid = false;
    }

    const hadiyaRaw = hadiyaInput.value.trim();
    const hadiya = parseInt(hadiyaRaw, 10);
    if (hadiyaRaw !== "" && (isNaN(hadiya) || hadiya < 0)) {
      showFieldError(hadiyaInput, "সঠিক পরিমাণ দিন (০ অথবা তার বেশি)।");
      valid = false;
    }

    if (!form.querySelector(".orderDelivery:checked")) {
      valid = false;
      submitError.textContent = "ডেলিভারি এলাকা নির্বাচন করুন।";
      submitError.classList.remove("hidden");
    }

    return { valid, name, phone: phoneRaw };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { valid, name, phone } = validate();
    if (!valid) return;

    const address = addressInput.value.trim();
    const hadiya = Math.max(0, parseInt(hadiyaInput.value, 10) || 0);
    const deliveryCharge = getDeliveryCharge();
    const checkedDelivery = form.querySelector(".orderDelivery:checked");
    const deliveryLabel = deliveryCharge === 130 ? "ঢাকার বাইরে" : "ঢাকার ভিতরে";
    const total = hadiya + deliveryCharge;

    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "জমা হচ্ছে...";

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, hadiya, deliveryCharge, deliveryLabel, total })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        submitError.textContent = (data && data.message) || "অর্ডারটি জমা দেওয়া যায়নি। আবার চেষ্টা করুন।";
        submitError.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
        submitBtn.textContent = originalText;
        return;
      }

      // Success: hide the form, show a thank-you message
      fieldsBox.classList.add("hidden");
      successBox.classList.remove("hidden");
      form.reset();
      updateTotal();
    } catch (err) {
      submitError.textContent = "ইন্টারনেট সংযোগ সমস্যা। আবার চেষ্টা করুন।";
      submitError.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      submitBtn.textContent = originalText;
    }
  });
})();

// ---------- Smooth anchor scroll offset for sticky header ----------
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  });
});
