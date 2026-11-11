// Shared by every language page: the language menu and the "Choose your language" start (from languages.json, so a
// language added through an issue shows up here without touching the other pages), the numbers (stats.json, made
// by scripts/stats.py) and the writers-per-language table.
//
// Joining starts with the language: every supported language has its own join form
// (.github/ISSUE_TEMPLATE/join-<code>.yml, language fixed, labelled lang:<code>). GitHub cannot prefill a dropdown
// from the URL, and the labels= parameter only works for people with write access, so one form per language is the
// reliable way to land on the right one. A language that is not listed goes to the "Add a language" form, whose text
// field (id "other") the search below prefills with "code Name / Native".
(function () {
  const REPO = "https://github.com/lorancecall/rmpp-hwr-db";
  const NEW = REPO + "/issues/new?template=";
  const main = document.querySelector("main");
  const root = (main && main.dataset.root) || "./";         // path from this page to the site root
  const here = document.documentElement.lang || "en";
  const nf = new Intl.NumberFormat(here);

  // Text of the parts built here. Pages in other languages use English until someone translates them.
  const TEXT = {
    en: {
      add: "+ Add your language",
      digitsOnly: "English + digits",
      writers: n => (n === 1 ? "1 writer" : `${nf.format(n)} writers`),
      notListed: "My language isn't listed", askForIt: "Ask for it",
      pickFirst: "Pick the language you will write to see its join form.",
      joinH: L => `Join in ${L}`,
      joinBtn: L => `Open the join form (${L})`,
      joinHow: "The form opens on GitHub, with your language already set. Tick the five consent items and submit; " +
        "a bot confirms in a minute and gives you the issue number for the next steps.",
      guide: L => `Read this guide in ${L}`,
      next: "Then follow \"How to take part\" below.",
      reqH: "Ask for your language",
      reqIntro: "Search your language by name or two-letter code.",
      reqLabel: "Your language",
      reqPlaceholder: "e.g. Japanese, 日本語, ja",
      reqFreeNote: "Not in the list: a bot will ask in the issue for the two-letter ISO 639-1 code.",
      reqAlready: L => `${L} is supported already.`,
      reqOpen: L => `Already asked? Requests for ${L}`,
      reqAllOpen: "Open language requests",
      afterH: "What happens after you ask",
      after: [
        "Within minutes a bot labels the issue and replies with what rmpp-hwr can do for the language today " +
          "(recognition, ink, typing).",
        "It opens a pull request that adds the language's page on this site and its own join form.",
        "Practice texts are prepared (public domain or openly licensed); sources you know help, write them in the issue.",
        "When a maintainer merges it, the language appears in the list above: join and write your first notebook. " +
          "Subscribe to your issue to hear when.",
      ],
    },
    ko: {
      add: "+ 언어 추가 요청",
      digitsOnly: "영어 + 숫자",
      writers: n => `참여자 ${nf.format(n)}명`,
      notListed: "목록에 내 언어가 없어요", askForIt: "언어 추가 요청",
      pickFirst: "손글씨로 쓸 언어를 고르면 그 언어의 참여 신청 양식이 나옵니다.",
      joinH: L => `${L}로 참여하기`,
      joinBtn: L => `참여 신청 양식 열기 (${L})`,
      joinHow: "GitHub에서 언어가 정해진 양식이 열립니다. 동의 항목 5개를 확인하고 제출하면, 1분 안에 봇이 확인 댓글로 " +
        "다음 단계에 쓸 이슈 번호를 알려 줍니다.",
      guide: L => `${L} 안내 페이지 보기`,
      next: "그다음 아래 \"참여 방법\"을 따라 하세요.",
      reqH: "언어 추가 요청",
      reqIntro: "언어 이름이나 두 글자 코드로 찾아보세요.",
      reqLabel: "내 언어",
      reqPlaceholder: "예: 일본어, 日本語, ja",
      reqFreeNote: "목록에 없는 언어는 이슈에서 봇이 두 글자 ISO 639-1 코드를 물어봅니다.",
      reqAlready: L => `${L}는 이미 지원합니다.`,
      reqOpen: L => `이미 요청됐는지 보기: ${L} 요청`,
      reqAllOpen: "열려 있는 언어 요청",
      afterH: "요청한 다음에는",
      after: [
        "몇 분 안에 봇이 이슈에 언어 라벨을 달고, 지금 rmpp-hwr이 그 언어로 할 수 있는 것(인식, 잉크, 입력)을 댓글로 알려 줍니다.",
        "봇이 이 사이트의 언어 페이지와 그 언어의 참여 신청 양식을 추가하는 PR을 엽니다.",
        "연습 문장(퍼블릭 도메인이나 공개 라이선스)을 준비합니다. 아는 출처가 있으면 이슈에 적어 주세요.",
        "관리자가 PR을 합치면 위 목록에 언어가 나타납니다. 참여 신청하고 첫 노트를 쓰면 됩니다. 이슈를 구독하면 알림을 받습니다.",
      ],
    },
  };
  const T = TEXT[here] || TEXT.en;

  // ISO 639-1 (scripts/languages.py) plus the variant zh-hant, for the "not listed" search.
  const ISO = ("aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz " +
    "ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is " +
    "it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt " +
    "my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm " +
    "sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh " +
    "zu zh-hant").split(" ");
  const dn = loc => { try { return new Intl.DisplayNames([loc], { type: "language", fallback: "none" }); } catch (e) { return null; } };
  const enNames = dn("en"), hereNames = dn(here);
  const tag = c => (c === "zh-hant" ? "zh-Hant" : c);
  const english = c => (enNames && enNames.of(tag(c))) || c;
  const native = c => { const d = dn(tag(c)); return (d && d.of(tag(c))) || english(c); };
  const local = c => (hereNames && hereNames.of(tag(c))) || english(c);  // name in this page's language

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
  let forms = {};                                       // request-form.json: the request form's texts by language
  Promise.all([get("languages.json"), get("stats.json"), get("request-form.json")]).then(([langs, s, f]) => {
    forms = f || {};
    const per = (s && s.languages) || {};
    if (langs) { menu(langs); start(langs, per); }
    if (s) numbers(s);
    if (langs || s) byLanguage(per, langs || {});
    const n = document.getElementById("s-langs");
    if (n && langs) n.textContent = nf.format(Object.keys(langs).length);
  });

  const supported = langs => {
    const codes = Object.keys(langs).filter(c => langs[c].page !== undefined);
    // this page's language first, then English, then the rest by code
    return codes.sort((a, b) => (a === here ? -1 : b === here ? 1 : a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
  };
  const label = (langs, c) => (langs[c] && (langs[c].native || langs[c].name)) || native(c);

  function menu(langs) {
    const nav = document.getElementById("langs");
    if (!nav) return;
    nav.replaceChildren();
    const codes = Object.keys(langs).filter(c => langs[c].page !== undefined);
    codes.sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));   // English first
    for (const c of codes) {
      nav.append(c === here ? el("b", { text: label(langs, c) })
        : el("a", { href: root + langs[c].page, lang: c, text: label(langs, c) }));
    }
    nav.append(el("a", { href: "#request", text: T.add }));
  }

  // "Choose your language": one card per supported language, then "not listed". The choice shows its join form
  // (and points every [data-join] link of the page to it); "not listed" shows the request search.
  function start(langs, per) {
    const pick = document.getElementById("pick"), next = document.getElementById("pick-next");
    if (!pick || !next) return;
    const codes = supported(langs);
    const cards = {};
    pick.replaceChildren();
    for (const c of codes) {
      const L = langs[c];
      const w = (per[c] && per[c].writers) || 0;
      // under the native name: the name in this page's language (or the English name on its own page)
      const sub = c === "en" ? T.digitsOnly
        : local(c) !== label(langs, c) ? local(c) : (L.name && L.name !== label(langs, c) ? L.name : "");
      const b = el("button", { type: "button", "aria-pressed": "false", lang: c },
        el("span", { class: "native", text: label(langs, c) }),
        el("span", { class: "sub", lang: here, text: [sub, w ? T.writers(w) : ""].filter(Boolean).join(" · ") }));
      b.addEventListener("click", () => choose(c, true));
      cards[c] = b;
      pick.append(b);
    }
    const other = el("button", { type: "button", class: "other", "aria-pressed": "false" },
      el("span", { class: "native", text: T.notListed }), el("span", { class: "sub", text: T.askForIt }));
    other.addEventListener("click", () => choose("", true));
    pick.append(other);

    function choose(c, user) {
      for (const [k, b] of Object.entries(cards)) b.setAttribute("aria-pressed", String(k === c));
      other.setAttribute("aria-pressed", String(c === ""));
      if (c === undefined) { next.replaceChildren(el("p", { class: "hint", text: T.pickFirst })); return; }
      if (c === "") { next.replaceChildren(request(langs, choose)); return; }
      const name = label(langs, c);
      const form = NEW + `join-${c}.yml`;
      for (const a of document.querySelectorAll("a[data-join]")) a.href = form;
      const guide = c !== here && langs[c].page !== undefined
        ? el("a", { class: "btn secondary", href: root + langs[c].page + "#start", text: T.guide(name) }) : null;
      next.replaceChildren(el("div", { class: "panel" },
        el("h3", { text: T.joinH(name) }),
        el("p", {}, el("a", { class: "btn", href: form, text: T.joinBtn(name) }), guide),
        el("p", { class: "small", text: T.joinHow }),
        el("p", { class: "small" }, el("a", { href: "#join", text: T.next }))));
      if (user) try { history.replaceState(null, "", "?lang=" + c + "#start"); } catch (e) {}
    }

    // Start: ?lang=xx (a shared link), "#request", this page's language (not on the English default page, which
    // everyone reaches first), or nothing chosen yet.
    const asked = new URLSearchParams(location.search).get("lang");
    if (location.hash === "#request") choose("");
    else if (asked && cards[asked]) choose(asked);
    else if (here !== "en" && cards[here]) choose(here);
    else choose(undefined);
    const toRequest = e => { if (e) e.preventDefault(); choose(""); document.getElementById("start").scrollIntoView({ behavior: "smooth" }); };
    window.addEventListener("hashchange", () => { if (location.hash === "#request") toRequest(); });
    for (const a of document.querySelectorAll("a[data-request]")) a.addEventListener("click", toRequest);
  }

  // The "not listed" panel: search the ISO 639-1 languages not supported yet (names from the browser's Intl data).
  // A found language gets a short form in that language (request-form.json; else this page's language, else
  // English) that opens a blank GitHub issue with title and body filled in: no issue template per language. The body
  // keeps English headings and a marker, which the language-request workflow reads.
  function request(langs, choose) {
    const known = new Set(Object.keys(langs));
    const opt = c => `${local(c)}${native(c) !== local(c) ? " / " + native(c) : ""} (${c})`;
    const list = el("datalist", { id: "iso-langs" });
    for (const c of ISO.filter(c => english(c) !== c && !known.has(c)).sort((a, b) => local(a).localeCompare(local(b), here)))
      list.append(el("option", { value: opt(c) }));
    const input = el("input", { id: "req-lang", type: "text", list: "iso-langs", autocomplete: "off",
      placeholder: T.reqPlaceholder });
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
        const b = el("button", { type: "button", class: "btn", text: T.joinBtn(label(langs, c)) });
        b.addEventListener("click", () => choose(c, true));
        out.replaceChildren(el("p", { text: T.reqAlready(label(langs, c)) }), el("p", {}, b));
      } else if (c || t) {
        out.replaceChildren(form(c, t));
      } else {
        out.replaceChildren();
      }
    };
    input.addEventListener("input", update);
    update();

    const after = el("ol");
    for (const s of T.after) after.append(el("li", { text: s }));
    return el("div", { class: "panel", id: "request" },
      el("h3", { text: T.reqH }),
      el("p", { class: "small", text: T.reqIntro }),
      el("label", { for: "req-lang", text: T.reqLabel }), input, list, out,
      el("h3", { text: T.afterH, style: "margin-top:18px" }), after,
      el("p", { class: "small" }, el("a", { href: issues("is:open label:language-request"), text: T.reqAllOpen })));
  }

  // The request form for language c (or free text t when the search found no code).
  function form(c, t) {
    const own = c && forms[c];
    const tl = own ? c : forms[here] ? here : "en";
    const F = Object.assign({}, forms.en || {}, forms[tl] || {});
    const name = !c ? t : own ? native(c) : local(c);
    const fill = s => (s || "").split("{lang}").join(name);
    const en = c ? english(c) : t, nat = c ? native(c) : "";
    const both = nat && nat !== en ? `${en} / ${nat}` : en;
    const writer = el("input", { type: "checkbox", id: "req-writer" });
    const notes = el("textarea", { id: "req-notes", rows: "3", maxlength: "1500" });
    notes.style.cssText = "font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);" +
      "border-radius:8px;padding:9px 12px;width:100%";
    const go = el("a", { class: "btn", text: fill(F.submit), target: "_blank", rel: "noopener" });
    const link = () => {
      const body = ["<!-- rmpp-hwr-db:language-request -->",
        "### Language", "", c ? `${both} (${c})` : "_No response_", "",
        "### Other language", "", c ? "_No response_" : t, "",
        "### Contributing", "",
        `- [${writer.checked ? "x" : " "}] I have a reMarkable Paper Pro and would write practice pages in this language.`, "",
        "### Notes", "", notes.value.trim() || "_No response_", ""].join("\n");
      const title = `[language] ${both}${c ? ` (${c})` : ""}`;
      go.href = `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    };
    writer.addEventListener("change", link);
    notes.addEventListener("input", link);
    link();
    const kids = [
      el("h3", { text: fill(F.title), style: "margin-top:16px" }),
      el("p", { class: "small", text: fill(F.intro) }),
      el("label", { style: "font-weight:400;display:flex;gap:8px;align-items:flex-start" }, writer, el("span", { text: fill(F.writer) })),
      el("label", { for: "req-notes", text: fill(F.notes) }), notes,
      el("p", {}, go)];
    if (F.review && own) kids.push(el("p", { class: "small", text: F.review }));
    if (c) kids.push(el("p", { class: "small", lang: here }, el("a", { href: issues(`label:"lang:${c}"`), text: T.reqOpen(local(c)) })));
    else kids.push(el("p", { class: "small", lang: here, text: T.reqFreeNote }));
    return el("div", { lang: tl }, ...kids);
  }

  function numbers(s) {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = nf.format(Number(v || 0)); };
    set("s-writers", s.writers); set("s-pages", s.pages); set("s-lines", s.lines); set("s-chars", s.char_samples);
    set("s-hangul", s.distinct_hangul);
    const mine = (s.languages || {})[here];
    if (mine) { set("s-lang-pages", mine.pages); set("s-lang-lines", mine.lines); }
  }

  // Writers, pages and lines per language: every supported language (languages.json), also those without data
  // yet, most writers first; this page's language in bold.
  function byLanguage(per, langs) {
    const table = document.getElementById("by-lang");
    if (!table) return;
    const head = here === "ko" ? ["언어", "참여자", "페이지", "줄"] : ["Language", "Writers", "Pages", "Lines"];
    const codes = [...new Set([...Object.keys(langs), ...Object.keys(per)])];
    const n = c => per[c] || { writers: 0, pages: 0, lines: 0 };
    codes.sort((a, b) => n(b).writers - n(a).writers || n(b).lines - n(a).lines || a.localeCompare(b));
    const tr = (cells, tg) => {
      const row = document.createElement("tr");
      cells.forEach((v, i) => row.appendChild(el(tg, { text: v, class: i ? "num" : null })));
      return row;
    };
    table.replaceChildren(tr(head, "th"));
    for (const c of codes) {
      const L = langs[c] || {};
      const name = L.native && L.native !== L.name ? `${L.native} (${L.name})` : (L.name || c);
      const row = tr([name, nf.format(n(c).writers), nf.format(n(c).pages), nf.format(n(c).lines)], "td");
      if (c === here) row.style.fontWeight = "700";
      table.appendChild(row);
    }
  }
})();
