// ---------- Admin: dynamic appointment form builder ----------
(function () {
  const builder = document.getElementById("builder");
  const form = document.querySelector(".js-builder-form");
  const hidden = document.querySelector(".js-builder-definition");
  const dataEl = document.getElementById("apptFormData");
  if (!builder || !form || !hidden || !dataEl) return;

  const CHOICE_TYPES = ["select", "radio", "checkbox-group"];
  const PLACEHOLDER_TYPES = ["text", "textarea", "number", "email", "tel", "date", "select"];
  const FIELD_TYPE_LABELS = {
    text: "টেক্সট (ইনপুট)",
    textarea: "বড় টেক্সট (টেক্সটএরিয়া)",
    number: "সংখ্যা",
    email: "ইমেইল",
    tel: "ফোন নম্বর",
    date: "তারিখ",
    select: "ড্রপডাউন",
    radio: "রেডিও (একটি নির্বাচন)",
    checkbox: "চেকবক্স (হ্যাঁ / না)",
    "checkbox-group": "চেকবক্স গ্রুপ (একাধিক)",
    note: "নোট / স্থির লেখা"
  };
  const WIDTH_LABELS = { full: "পূর্ণ প্রস্থ", half: "অর্ধেক", third: "এক-তৃতীয়াংশ" };

  let initial = {};
  try {
    initial = JSON.parse(dataEl.textContent || "{}");
  } catch (e) {
    initial = {};
  }
  const state = { sections: Array.isArray(initial.sections) ? initial.sections : [] };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function genKey() {
    return "f_" + Math.random().toString(36).slice(2, 9);
  }
  function newOption() {
    return { value: "", labelBn: "", labelEn: "" };
  }
  function newField() {
    return { key: genKey(), type: "text", labelBn: "", labelEn: "", placeholderBn: "", placeholderEn: "", required: false, width: "full", options: [] };
  }
  function newSection() {
    return { titleBn: "", titleEn: "", fields: [] };
  }

  function selectHtml(prop, current, map, extra) {
    let html = '<select data-prop="' + prop + '" ' + (extra || "") + ' class="admin-input">';
    Object.keys(map).forEach(function (k) {
      html += '<option value="' + k + '"' + (k === current ? " selected" : "") + ">" + esc(map[k]) + "</option>";
    });
    return html + "</select>";
  }

  function optionsHtml(field) {
    let rows = "";
    (field.options || []).forEach(function (opt, oi) {
      rows +=
        '<div class="grid grid-cols-1 gap-2 rounded-md bg-primary-50/50 p-2 sm:grid-cols-[1fr_1fr_1fr_auto]" data-oi="' + oi + '">' +
        '<input type="text" data-prop="value" value="' + esc(opt.value) + '" placeholder="ভ্যালু (ঐচ্ছিক)" class="admin-input !py-1.5 text-sm" />' +
        '<input type="text" data-prop="labelBn" value="' + esc(opt.labelBn) + '" placeholder="অপশন (বাংলা)" class="admin-input !py-1.5 text-sm" />' +
        '<input type="text" data-prop="labelEn" value="' + esc(opt.labelEn) + '" placeholder="Option (English)" class="admin-input !py-1.5 text-sm" />' +
        '<button type="button" data-action="del-option" class="rounded-md border border-clay/40 px-2 text-sm font-bold text-clay hover:bg-clay hover:text-white">✕</button>' +
        "</div>";
    });
    return (
      '<div class="mt-3 space-y-2 rounded-lg border border-primary-900/10 p-3">' +
      '<p class="text-xs font-bold uppercase tracking-wide text-ink/50">অপশনসমূহ</p>' +
      rows +
      '<button type="button" data-action="add-option" class="rounded-md bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-200">+ অপশন যোগ করুন</button>' +
      "</div>"
    );
  }

  function fieldHtml(field, fi, fieldsLen) {
    const isChoice = CHOICE_TYPES.indexOf(field.type) !== -1;
    const isNote = field.type === "note";
    const showPh = PLACEHOLDER_TYPES.indexOf(field.type) !== -1;
    const labelBnCtrl = isNote
      ? '<textarea data-prop="labelBn" rows="2" class="admin-input">' + esc(field.labelBn) + "</textarea>"
      : '<input type="text" data-prop="labelBn" value="' + esc(field.labelBn) + '" class="admin-input" />';
    const labelEnCtrl = isNote
      ? '<textarea data-prop="labelEn" rows="2" class="admin-input">' + esc(field.labelEn) + "</textarea>"
      : '<input type="text" data-prop="labelEn" value="' + esc(field.labelEn) + '" class="admin-input" />';

    let html =
      '<div class="builder-field rounded-lg border border-primary-900/10 bg-white p-4" data-fi="' + fi + '">' +
      '<div class="mb-3 flex flex-wrap items-center gap-2">' +
        '<div class="min-w-[180px] flex-1">' + selectHtml("type", field.type, FIELD_TYPE_LABELS, 'data-rerender="1"') + "</div>";

    if (!isNote) {
      html +=
        '<div class="min-w-[130px]">' + selectHtml("width", field.width, WIDTH_LABELS) + "</div>" +
        '<label class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-900/15 px-3 py-2 text-sm font-medium">' +
          '<input type="checkbox" data-prop="required"' + (field.required ? " checked" : "") + ' class="accent-primary-600" /> আবশ্যক' +
        "</label>";
    }

    html +=
        '<div class="ml-auto flex gap-1">' +
          '<button type="button" data-action="move-field-up" class="rounded-md border border-primary-900/15 px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-primary-50"' + (fi === 0 ? " disabled" : "") + ">↑</button>" +
          '<button type="button" data-action="move-field-down" class="rounded-md border border-primary-900/15 px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-primary-50"' + (fi === fieldsLen - 1 ? " disabled" : "") + ">↓</button>" +
          '<button type="button" data-action="del-field" class="rounded-md border border-clay/40 px-2 py-1 text-xs font-bold text-clay hover:bg-clay hover:text-white">মুছুন</button>' +
        "</div>" +
      "</div>" +
      '<div class="grid gap-3 sm:grid-cols-2">' +
        '<div><label class="admin-label">' + (isNote ? "লেখা (বাংলা)" : "লেবেল (বাংলা)") + "</label>" + labelBnCtrl + "</div>" +
        '<div><label class="admin-label">' + (isNote ? "লেখা (English)" : "লেবেল (English)") + "</label>" + labelEnCtrl + "</div>";

    if (showPh) {
      html +=
        '<div><label class="admin-label">প্লেসহোল্ডার (বাংলা)</label><input type="text" data-prop="placeholderBn" value="' + esc(field.placeholderBn) + '" class="admin-input" /></div>' +
        '<div><label class="admin-label">প্লেসহোল্ডার (English)</label><input type="text" data-prop="placeholderEn" value="' + esc(field.placeholderEn) + '" class="admin-input" /></div>';
    }

    html += "</div>";
    if (isChoice) html += optionsHtml(field);
    html += "</div>";
    return html;
  }

  function sectionHtml(section, si, sectionsLen) {
    let fields = "";
    if (!section.fields.length) {
      fields = '<p class="rounded-lg border border-dashed border-primary-900/20 p-4 text-center text-sm text-ink/50">এই সেকশনে এখনো কোনো ফিল্ড নেই।</p>';
    } else {
      section.fields.forEach(function (f, fi) {
        fields += fieldHtml(f, fi, section.fields.length);
      });
    }

    return (
      '<div class="admin-card space-y-4" data-si="' + si + '">' +
      '<div class="flex flex-wrap items-end gap-3 border-b border-primary-900/10 pb-4">' +
        '<div class="min-w-[180px] flex-1"><label class="admin-label">সেকশন শিরোনাম (বাংলা)</label><input type="text" data-prop="titleBn" value="' + esc(section.titleBn) + '" class="admin-input" /></div>' +
        '<div class="min-w-[180px] flex-1"><label class="admin-label">সেকশন শিরোনাম (English)</label><input type="text" data-prop="titleEn" value="' + esc(section.titleEn) + '" class="admin-input" /></div>' +
        '<div class="flex gap-1">' +
          '<button type="button" data-action="move-section-up" class="rounded-md border border-primary-900/15 px-2 py-2 text-xs font-semibold text-ink/70 hover:bg-primary-50"' + (si === 0 ? " disabled" : "") + ">↑</button>" +
          '<button type="button" data-action="move-section-down" class="rounded-md border border-primary-900/15 px-2 py-2 text-xs font-semibold text-ink/70 hover:bg-primary-50"' + (si === sectionsLen - 1 ? " disabled" : "") + ">↓</button>" +
          '<button type="button" data-action="del-section" class="rounded-md border border-clay/40 px-3 py-2 text-xs font-bold text-clay hover:bg-clay hover:text-white">সেকশন মুছুন</button>' +
        "</div>" +
      "</div>" +
      '<div class="space-y-3">' + fields + "</div>" +
      '<button type="button" data-action="add-field" class="rounded-lg bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-200">+ ফিল্ড যোগ করুন</button>' +
      "</div>"
    );
  }

  function render() {
    let html = "";
    state.sections.forEach(function (s, si) {
      html += sectionHtml(s, si, state.sections.length);
    });
    html += '<button type="button" data-action="add-section" class="admin-btn w-full sm:w-auto">+ নতুন সেকশন যোগ করুন</button>';
    builder.innerHTML = html;
  }

  // Resolve state indices from an element's ancestry.
  function ctx(el) {
    const secEl = el.closest("[data-si]");
    const fieldEl = el.closest("[data-fi]");
    const optEl = el.closest("[data-oi]");
    return {
      si: secEl ? +secEl.dataset.si : -1,
      fi: fieldEl ? +fieldEl.dataset.fi : -1,
      oi: optEl ? +optEl.dataset.oi : -1
    };
  }

  // Text/select/checkbox edits: mutate state in place (no re-render, keeps focus).
  function onEdit(e) {
    const el = e.target;
    const prop = el.dataset.prop;
    if (!prop) return;
    const { si, fi, oi } = ctx(el);
    if (si < 0) return;

    if (oi >= 0) {
      state.sections[si].fields[fi].options[oi][prop] = el.value;
    } else if (fi >= 0) {
      const field = state.sections[si].fields[fi];
      if (prop === "required") {
        field.required = el.checked;
      } else if (prop === "type") {
        field.type = el.value;
        if (CHOICE_TYPES.indexOf(el.value) !== -1 && (!field.options || !field.options.length)) {
          field.options = [newOption(), newOption()];
        }
        render(); // structural: options editor visibility changes
      } else {
        field[prop] = el.value;
      }
    } else {
      state.sections[si][prop] = el.value;
    }
  }

  function swap(arr, i, j) {
    if (j < 0 || j >= arr.length) return;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const { si, fi, oi } = ctx(btn);

    switch (action) {
      case "add-section":
        state.sections.push(newSection());
        break;
      case "del-section":
        if (confirm("এই সেকশন এবং এর সব ফিল্ড মুছে ফেলা হবে?")) state.sections.splice(si, 1);
        else return;
        break;
      case "move-section-up":
        swap(state.sections, si, si - 1);
        break;
      case "move-section-down":
        swap(state.sections, si, si + 1);
        break;
      case "add-field":
        state.sections[si].fields.push(newField());
        break;
      case "del-field":
        state.sections[si].fields.splice(fi, 1);
        break;
      case "move-field-up":
        swap(state.sections[si].fields, fi, fi - 1);
        break;
      case "move-field-down":
        swap(state.sections[si].fields, fi, fi + 1);
        break;
      case "add-option":
        state.sections[si].fields[fi].options.push(newOption());
        break;
      case "del-option":
        state.sections[si].fields[fi].options.splice(oi, 1);
        break;
      default:
        return;
    }
    render();
  }

  builder.addEventListener("input", onEdit);
  builder.addEventListener("change", onEdit);
  builder.addEventListener("click", onClick);

  // Serialize the whole definition into the hidden input just before submit.
  form.addEventListener("submit", function () {
    const meta = {};
    document.querySelectorAll("[data-meta]").forEach(function (el) {
      meta[el.dataset.meta] = el.value;
    });
    hidden.value = JSON.stringify(Object.assign(meta, { sections: state.sections }));
  });

  render();
})();
