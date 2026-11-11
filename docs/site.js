// Shared by every language page: the language menu (from languages.json, so a language added through an issue
// shows up here without touching the other pages) and the numbers (stats.json, made by scripts/stats.py).
(function () {
  const main = document.querySelector("main");
  const root = (main && main.dataset.root) || "./";         // path from this page to the site root
  const here = document.documentElement.lang || "en";
  const nf = new Intl.NumberFormat(here);

  fetch(root + "languages.json").then(r => (r.ok ? r.json() : null)).then(langs => {
    const nav = document.getElementById("langs");
    if (!langs || !nav) return;
    const codes = Object.keys(langs).filter(c => langs[c].page !== undefined);
    codes.sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));   // English first
    for (const c of codes) {
      const label = langs[c].native || langs[c].name || c;
      if (c === here) {
        const b = document.createElement("b");
        b.textContent = label;
        nav.appendChild(b);
      } else {
        const a = document.createElement("a");
        a.href = root + langs[c].page;
        a.textContent = label;
        a.lang = c;
        nav.appendChild(a);
      }
    }
    // languages without a page yet: the "Add a language" form (a request opens a pull request with its page)
    const add = document.createElement("a");
    add.href = "https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml";
    add.textContent = here === "ko" ? "+ 언어 추가 요청" : "+ Add your language";
    nav.appendChild(add);
    const n = document.getElementById("s-langs");
    if (n) n.textContent = nf.format(Object.keys(langs).length);
  }).catch(() => {});

  const get = f => fetch(root + f).then(r => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([get("stats.json"), get("languages.json")]).then(([s, langs]) => {
    if (!s) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = nf.format(Number(v || 0)); };
    set("s-writers", s.writers); set("s-pages", s.pages); set("s-lines", s.lines); set("s-chars", s.char_samples);
    set("s-hangul", s.distinct_hangul);
    const per = s.languages || {};
    const mine = per[here];
    if (mine) { set("s-lang-pages", mine.pages); set("s-lang-lines", mine.lines); }
    byLanguage(per, langs || {});
  });

  // Writers, pages and lines per language: every supported language (languages.json), also those without data
  // yet, most writers first; this page's language in bold.
  function byLanguage(per, langs) {
    const table = document.getElementById("by-lang");
    if (!table) return;
    const ko = here === "ko";
    const head = ko ? ["언어", "참여자", "페이지", "줄"] : ["Language", "Writers", "Pages", "Lines"];
    const codes = [...new Set([...Object.keys(langs), ...Object.keys(per)])];
    const n = c => per[c] || { writers: 0, pages: 0, lines: 0 };
    codes.sort((a, b) => n(b).writers - n(a).writers || n(b).lines - n(a).lines || a.localeCompare(b));
    const tr = (cells, tag) => {
      const row = document.createElement("tr");
      cells.forEach((v, i) => {
        const cell = document.createElement(tag);
        cell.textContent = v;
        if (i) cell.className = "num";
        row.appendChild(cell);
      });
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
