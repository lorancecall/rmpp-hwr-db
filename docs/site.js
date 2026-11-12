// The site is one page (docs/index.html, English) shown in the language the visitor chooses. Elements with
// data-t="key" get their text from docs/i18n/<code>.json ("page"), the parts built here from its "ui" (else
// English, below). A supported language without a translation file shows the English text.
//
// Also built here: "Choose your language", which also switches the page (from languages.json, so a language added through
// an issue shows up without touching the page), the numbers (stats.json, made by scripts/stats.py) and the
// writers-per-language table.
//
// Joining starts with the language: every supported language has its own join form
// (.github/ISSUE_TEMPLATE/join-<code>.yml, language fixed, labelled lang:<code>). GitHub cannot prefill a dropdown
// from the URL, and the labels= parameter only works for people with write access, so one form per language is the
// reliable way to land on the right one. A language that is not listed gets a short request form (below).
(function () {
  const REPO = "https://github.com/lorancecall/rmpp-hwr-db";
  const NEW = REPO + "/issues/new?template=";
  const main = document.querySelector("main");
  const root = (main && main.dataset.root) || "./";         // path from this page to the site root
  const SAVED = "rmpp-hwr-db-lang";

  // English texts of the parts built here; a translation's "ui" replaces them key by key. {lang} and {n} are filled in.
  const EN = {
    digitsOnly: "English + digits",
    digits: "digits",
    writers: "{n} writers", writers1: "1 writer",
    notListed: "My language isn't listed", askForIt: "Ask for it",
    pickFirst: "Pick the language you will write to see its join form.",
    joinH: "Join in {lang}",
    joinBtn: "Open the join form ({lang})",
    joinHow: "The form opens on GitHub, with your language already set. Tick the five consent items and submit; " +
      "a bot confirms in a minute and gives you the issue number for the next steps.",
    next: "Then follow \"How to take part\" below.",
    sendBtn: "Send sentences in {lang}",
    sendWhy: "No tablet, or want to help more? Send proverbs or sentences for the practice notebooks.",
    reqH: "Ask for your language",
    reqIntro: "Search your language by name or two-letter code.",
    reqLabel: "Your language",
    reqPlaceholder: "e.g. Japanese, 日本語, ja",
    reqFreeNote: "Not in the list: a bot will ask in the issue for the two-letter ISO 639-1 code.",
    reqAlready: "{lang} is supported already.",
    reqOpen: "Already asked? Requests for {lang}",
    reqAllOpen: "Open language requests",
    afterH: "What happens after you ask",
    after: [
      "Within minutes a bot labels the issue and replies with what rmpp-hwr can do for the language today " +
        "(recognition, ink, typing).",
      "The language starts collecting practice sentences: yours and anyone else's, each checked automatically " +
        "(spelling, content, personal data).",
      "When 100 have passed, its join form opens and it appears in the list above: join and write your first " +
        "notebook. Subscribe to your issue to hear when.",
    ],
    collectSub: "{n}/{goal} sentences",
    collectH: "{lang}: collecting sentences",
    collectHow: "{lang} opens for joining when {goal} practice sentences have passed the checks ({n} so far). " +
      "Send some in {lang}:",
    table: ["Language", "Writers", "Pages", "Lines"],
  };

  // Current language (set by show()): code, its translation, number format, language names in it.
  let here = "en", UI = EN, nf = new Intl.NumberFormat("en"), hereNames = null;
  const T = (k, v) => String(UI[k] !== undefined ? UI[k] : EN[k]).replace(/\{(\w+)\}/g, (m, x) => (v && x in v ? v[x] : m));
  const writers = n => (n === 1 ? T("writers1") : T("writers", { n: nf.format(n) }));

  // ISO 639-1 (scripts/languages.py) plus the variant zh-hant, for the "not listed" search.
  const ISO = ("aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz " +
    "ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is " +
    "it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt " +
    "my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm " +
    "sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh " +
    "zu zh-hant").split(" ");
  const dn = loc => { try { return new Intl.DisplayNames([loc], { type: "language", fallback: "none" }); } catch (e) { return null; } };
  const enNames = dn("en");
  const tag = c => (c === "zh-hant" ? "zh-Hant" : c);
  const english = c => (enNames && enNames.of(tag(c))) || c;
  const native = c => { const d = dn(tag(c)); return (d && d.of(tag(c))) || english(c); };
  const local = c => (hereNames && hereNames.of(tag(c))) || english(c);  // name in the current language

  const el = (name, attrs, ...kids) => {
    const e = document.createElement(name);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "text") e.textContent = v; else if (k === "class") e.className = v; else e.setAttribute(k, v);
    }
    for (const k of kids) if (k) e.append(k);
    return e;
  };
  const issues = q => `${REPO}/issues?q=${encodeURIComponent("is:issue " + q)}`;
  const get = f => fetch(root + f).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };

  // The English page as written, to switch back from a translation.
  const english0 = {
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content,
    page: Object.fromEntries([...document.querySelectorAll("[data-t]")].map(e => [e.dataset.t, e.innerHTML])),
  };
  const translations = { en: english0 };
  const translation = c => (c in translations ? Promise.resolve(translations[c])
    : get(`i18n/${c}.json`).then(j => (translations[c] = j)));

  let langs = {}, stats = null, forms = {};
  let chosen;                                           // the chosen card: a code, "" (not listed) or undefined

  // Show the page in language c (a supported language): its texts, or English where it has none.
  function show(c, tr) {
    here = c;
    const t = tr || {};
    UI = t.ui || EN;
    const textLang = tr ? c : "en";
    document.documentElement.lang = textLang;
    nf = new Intl.NumberFormat(c);
    hereNames = dn(tag(c));
    document.title = t.title || english0.title;
    const d = document.querySelector('meta[name="description"]');
    if (d) d.content = t.description || english0.description;
    for (const e of document.querySelectorAll("[data-t]")) {
      const v = (t.page || {})[e.dataset.t];
      e.innerHTML = v !== undefined ? v : english0.page[e.dataset.t];
    }
    for (const e of document.querySelectorAll("[data-only]")) e.hidden = e.dataset.only !== c;
    const tb = document.getElementById("by-lang");
    if (tb) tb.setAttribute("aria-label", t.byLang || "Writers per language");
    render();
  }

  function render() {
    const per = (stats && stats.languages) || {};
    start(per);
    if (stats) numbers(stats);
    byLanguage(per);
    const n = document.getElementById("s-langs");
    if (n) n.textContent = nf.format(supported().length);
    for (const a of document.querySelectorAll("a[data-request]")) a.onclick = toRequest;
  }

  // Switch to language c (a supported language), remember it, and show its join panel.
  function use(c, pick) {
    store(SAVED, c);
    try { history.replaceState(null, "", "?lang=" + c + (pick ? "#start" : location.hash)); } catch (e) {}
    if (pick) chosen = c;
    if (c === here) { render(); return Promise.resolve(); }
    return translation(c).then(tr => show(c, c === "en" ? null : tr));
  }

  const supported = () => {
    // English first, then by code: the cards keep their places when the page switches language
    return Object.keys(langs).sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
  };
  const label = c => (langs[c] && (langs[c].native || langs[c].name)) || native(c);


  // "Choose your language": one card per supported language, then "not listed". Choosing a language shows the page
  // in it, with its join form (every [data-join] link of the page points to it); "not listed" shows the request search.
  let cards = {}, other = null;
  function start(per) {
    const pick = document.getElementById("pick"), next = document.getElementById("pick-next");
    if (!pick || !next) return;
    cards = {};
    pick.replaceChildren();
    for (const c of supported()) {
      const L = langs[c];
      const w = (per[c] && per[c].writers) || 0;
      // under the native name: the name in the current language (or the English name for the current language)
      const sub = c === "en" ? T("digitsOnly")
        : local(c) !== label(c) ? local(c) : (L.name && L.name !== label(c) ? L.name : "");
      const b = el("button", { type: "button", "aria-pressed": "false", lang: c },
        el("span", { class: "native", text: label(c) }),
        el("span", { class: "sub", text: [sub, w ? writers(w) : ""].filter(Boolean).join(" · ") }));
      b.addEventListener("click", () => use(c, true));
      cards[c] = b;
      pick.append(b);
    }
    // languages collecting their first practice sentences (requested, not open yet), most sentences first
    for (const c of collecting().sort((a, b) => texts(b) - texts(a))) {
      const b = el("button", { type: "button", class: "collecting", "aria-pressed": "false", lang: c },
        el("span", { class: "native", text: native(c) }),
        el("span", { class: "sub", text: [local(c) !== native(c) ? local(c) : "",
          T("collectSub", { n: nf.format(texts(c)), goal: GOAL() })].filter(Boolean).join(" · ") }));
      b.addEventListener("click", () => choose(c));
      cards[c] = b;
      pick.append(b);
    }
    other = el("button", { type: "button", class: "other", "aria-pressed": "false" },
      el("span", { class: "native", text: T("notListed") }), el("span", { class: "sub", text: T("askForIt") }));
    other.addEventListener("click", () => choose(""));
    pick.append(other);
    choose(chosen);
  }

  function choose(c) {
    chosen = c;
    const next = document.getElementById("pick-next");
    for (const [k, b] of Object.entries(cards)) b.setAttribute("aria-pressed", String(k === c));
    if (other) other.setAttribute("aria-pressed", String(c === ""));
    // the practice command follows the chosen language, else the page's language
    const cmd = document.getElementById("cmd-practice"), lc = c || here;
    if (cmd && langs[lc]) {
      const mix = (langs[lc].mix || [lc, "en", "digits"]).map(m => (m === "digits" ? T("digits") : local(m)));
      cmd.textContent = `hwr practice --v2 --lang ${lc}    # ${mix.join(" + ")}`;
    }
    if (langs[lc]) for (const a of document.querySelectorAll("a[data-join]")) a.href = NEW + `join-${lc}.yml`;
    if (c === undefined) { next.replaceChildren(el("p", { class: "hint", text: T("pickFirst") })); return; }
    if (c === "") { next.replaceChildren(request()); return; }
    if (!langs[c]) { next.replaceChildren(collect(c)); return; }
    const name = label(c);
    const joinUrl = NEW + `join-${c}.yml`;
    // sentences for the practice texts, in this language (the same short form as a language request)
    const slot = el("div");
    const sendBtn = el("button", { type: "button", class: "btn secondary", text: T("sendBtn", { lang: name }) });
    sendBtn.addEventListener("click", () => { slot.replaceChildren(form(c, "", "send")); sendBtn.style.display = "none"; });
    next.replaceChildren(el("div", { class: "panel" },
      el("h3", { text: T("joinH", { lang: name }) }),
      el("p", {}, el("a", { class: "btn", href: joinUrl, text: T("joinBtn", { lang: name }) })),
      el("p", { class: "small", text: T("joinHow") }),
      el("p", { class: "small" }, el("a", { href: "#join", text: T("next") })),
      el("p", { class: "small", text: T("sendWhy"), style: "margin-top:14px" }), el("p", {}, sendBtn), slot));
  }

  // A requested language that is not open yet: how far its sentences are, and the form to send more.
  const texts = c => ((stats && stats.texts) || {})[c] || 0;
  const GOAL = () => (stats && stats.texts_goal) || 100;
  const collecting = () => Object.keys((stats && stats.texts) || {}).filter(c => !langs[c]);
  function collect(c) {
    const n = texts(c), name = local(c);
    return el("div", { class: "panel" },
      el("h3", { text: T("collectH", { lang: name }) }),
      el("progress", { max: GOAL(), value: Math.min(n, GOAL()), style: "width:100%;accent-color:var(--accent)" }),
      el("p", { class: "small", text: T("collectHow", { lang: name, n: nf.format(n), goal: GOAL() }) }),
      form(c, "", "send"));
  }

  function toRequest(e) {
    if (e) e.preventDefault();
    choose("");
    document.getElementById("start").scrollIntoView({ behavior: "smooth" });
  }
  window.addEventListener("hashchange", () => { if (location.hash === "#request") toRequest(); });

  // The "not listed" panel: search the ISO 639-1 languages not supported yet (names from the browser's Intl data).
  // A found language gets a short form in that language (request-form.json; else the page's language, else
  // English) that opens a blank GitHub issue with title and body filled in: no issue template per language. The body
  // keeps English headings and a marker, which the language-request workflow reads.
  function request() {
    const known = new Set(Object.keys(langs));
    const opt = c => `${local(c)}${native(c) !== local(c) ? " / " + native(c) : ""} (${c})`;
    const list = el("datalist", { id: "iso-langs" });
    for (const c of ISO.filter(c => english(c) !== c && !known.has(c)).sort((a, b) => local(a).localeCompare(local(b), here)))
      list.append(el("option", { value: opt(c) }));
    const input = el("input", { id: "req-lang", type: "text", list: "iso-langs", autocomplete: "off",
      placeholder: T("reqPlaceholder") });
    const out = el("div", { "aria-live": "polite" });

    const find = t => {
      const q = t.trim().toLowerCase();
      if (!q) return "";
      const m = q.match(/\(([a-z]{2}(?:-[a-z]{2,4})?)\)\s*$/);
      if (m && ISO.includes(m[1])) return m[1];
      if (ISO.includes(q)) return q;
      return ISO.find(c => [english(c), native(c), local(c)].some(n => n.toLowerCase() === q)) || null;
    };
    let shown = null;                                   // keep the form (and what was typed) while the input is the same language
    const update = () => {
      const t = input.value.trim(), c = find(t);
      const key = c || (t ? "?" + t : "");
      if (key === shown) return;
      shown = key;
      if (c && known.has(c)) {
        const b = el("button", { type: "button", class: "btn", text: T("joinBtn", { lang: label(c) }) });
        b.addEventListener("click", () => use(c, true));
        out.replaceChildren(el("p", { text: T("reqAlready", { lang: label(c) }) }), el("p", {}, b));
      } else if (c && texts(c)) {
        out.replaceChildren(collect(c));                // asked for already: help it reach the goal
      } else if (c || t) {
        out.replaceChildren(form(c, t, "request"));
      } else {
        out.replaceChildren();
      }
    };
    input.addEventListener("input", update);
    update();

    const after = el("ol");
    for (const s of UI.after || EN.after) after.append(el("li", { text: s }));
    return el("div", { class: "panel", id: "request" },
      el("h3", { text: T("reqH") }),
      el("p", { class: "small", text: T("reqIntro") }),
      el("label", { for: "req-lang", text: T("reqLabel") }), input, list, out,
      el("h3", { text: T("afterH"), style: "margin-top:18px" }), after,
      el("p", { class: "small" }, el("a", { href: issues("is:open label:language-request"), text: T("reqAllOpen") })));
  }

  // The short form for language c (or free text t when the search found no code), in that language when
  // request-form.json has it (else the page's language, else English). mode "request": a language that is not
  // supported yet; mode "send": sentences for a supported language. Both open a blank GitHub issue with title and body
  // filled in (English headings + a marker the workflows read): no issue template per language.
  function form(c, t, mode) {
    const send = mode === "send";
    const own = c && forms[c];
    const tl = own ? c : forms[here] ? here : "en";
    const F = Object.assign({}, forms.en || {}, forms[tl] || {});
    const name = !c ? t : own ? native(c) : local(c);
    const fill = s => (s || "").split("{lang}").join(name);
    const en = c ? english(c) : t, nat = c ? native(c) : "";
    const both = nat && nat !== en ? `${en} / ${nat}` : en;
    const area = (id, rows, max) => {
      const x = el("textarea", { id, rows, maxlength: max });
      x.style.cssText = "font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);" +
        "border-radius:8px;padding:9px 12px;width:100%";
      return x;
    };
    const writer = el("input", { type: "checkbox", id: "req-writer" });
    const lines = area("req-sentences", "8", "3000");
    const notes = area("req-notes", "3", "1500");
    const go = el("a", { class: "btn", text: fill(F.submit), target: "_blank", rel: "noopener" });
    const copied = el("p", { class: "small", text: fill(F.copied), hidden: "" });
    const LIMIT = 7000;                                  // GitHub refuses very long issue links
    let tooLong = false;
    const link = () => {
      const said = lines.value.split("\n").map(x => x.trim()).filter(Boolean).join("\n");
      const build = sentences => (send
        ? ["<!-- rmpp-hwr-db:sentences -->", "### Language", "", `${both} (${c})`, "",
           "### Practice sentences", "", sentences || "_No response_", ""]
        : ["<!-- rmpp-hwr-db:language-request -->",
           "### Language", "", c ? `${both} (${c})` : "_No response_", "",
           "### Other language", "", c ? "_No response_" : t, "",
           "### Practice sentences", "", sentences || "_No response_", "",
           "### Contributing", "",
           `- [${writer.checked ? "x" : " "}] I have a reMarkable Paper Pro and would write practice pages in this language.`, "",
           "### Notes", "", notes.value.trim() || "_No response_", ""]).join("\n");
      const title = `[${send ? "sentences" : "language"}] ${both}${c ? ` (${c})` : ""}`;
      const url = body => `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      let href = url(build(said));
      tooLong = href.length > LIMIT;
      if (tooLong) href = url(build("<!-- paste the sentences here (they are on the clipboard) -->"));
      go.href = href;
    };
    go.addEventListener("click", () => {
      if (!tooLong) return;
      const said = lines.value.split("\n").map(x => x.trim()).filter(Boolean).join("\n");
      try { navigator.clipboard.writeText(said); } catch (e) {}
      copied.hidden = false;
    });
    for (const x of [writer, lines, notes]) x.addEventListener(x === writer ? "change" : "input", link);
    link();
    const kids = [
      el("h3", { text: fill(send ? F.sendTitle : F.title), style: "margin-top:16px" }),
      el("p", { class: "small", text: fill(send ? F.sendIntro : F.intro) })];
    if (!send) kids.push(el("label", { style: "font-weight:400;display:flex;gap:8px;align-items:flex-start" },
      writer, el("span", { text: fill(F.writer) })));
    kids.push(el("label", { for: "req-sentences", text: fill(F.sentences) }),
      el("p", { class: "small", text: fill(F.sentencesHint) }), lines);
    if (!send) kids.push(el("label", { for: "req-notes", text: fill(F.notes) }), notes);
    kids.push(el("p", {}, go), copied);
    if (F.review && own) kids.push(el("p", { class: "small", text: F.review }));
    if (!send && c) kids.push(el("p", { class: "small", lang: here }, el("a", { href: issues(`label:"lang:${c}"`), text: T("reqOpen", { lang: local(c) }) })));
    else if (!send) kids.push(el("p", { class: "small", lang: here, text: T("reqFreeNote") }));
    return el("div", { lang: tl }, ...kids);
  }

  function numbers(s) {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = nf.format(Number(v || 0)); };
    set("s-writers", s.writers); set("s-pages", s.pages); set("s-lines", s.lines); set("s-chars", s.char_samples);
    set("s-hangul", s.distinct_hangul);
  }

  // Writers, pages and lines per language: every supported language (languages.json), also those without data
  // yet, most writers first; the current language in bold.
  function byLanguage(per) {
    const table = document.getElementById("by-lang");
    if (!table) return;
    const codes = [...new Set([...Object.keys(langs), ...Object.keys(per)])];
    if (!codes.length) return;
    const n = c => per[c] || { writers: 0, pages: 0, lines: 0 };
    codes.sort((a, b) => n(b).writers - n(a).writers || n(b).lines - n(a).lines || a.localeCompare(b));
    const tr = (cells, tg) => {
      const row = document.createElement("tr");
      cells.forEach((v, i) => row.appendChild(el(tg, { text: v, class: i ? "num" : null })));
      return row;
    };
    table.replaceChildren(tr(UI.table || EN.table, "th"));
    for (const c of codes) {
      const L = langs[c] || {};
      const name = L.native && L.native !== L.name ? `${L.native} (${L.name})` : (L.name || c);
      const row = tr([name, nf.format(n(c).writers), nf.format(n(c).pages), nf.format(n(c).lines)], "td");
      if (c === here) row.style.fontWeight = "700";
      table.appendChild(row);
    }
  }

  // Start: the language from ?lang=xx (a shared link; that card is chosen), else the one chosen last time, else the
  // browser's language when supported, else English. "#request" opens the request search.
  Promise.all([get("languages.json"), get("stats.json"), get("request-form.json")]).then(([l, s, f]) => {
    langs = l || {}; stats = s; forms = f || {};
    const ok = c => c && Object.prototype.hasOwnProperty.call(langs, c);
    const asked = new URLSearchParams(location.search).get("lang");
    const saved = store(SAVED);
    const browser = (navigator.languages || [navigator.language || ""]).map(x => {
      const t = x.toLowerCase();
      return /^zh-(hant|tw|hk|mo)/.test(t) ? "zh-hant" : t.split("-")[0];
    }).find(ok);
    const c = ok(asked) ? asked : ok(saved) ? saved : browser || "en";
    chosen = location.hash === "#request" ? "" : ok(asked) || ok(saved) ? c : undefined;
    const done = () => { if (location.hash === "#start" || location.hash === "#request") document.getElementById("start").scrollIntoView(); };
    if (c === "en") { show("en", null); done(); }
    else translation(c).then(tr => { show(c, tr); done(); });
  });
})();
