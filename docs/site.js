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

  fetch(root + "stats.json").then(r => (r.ok ? r.json() : null)).then(s => {
    if (!s) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = nf.format(Number(v || 0)); };
    set("s-writers", s.writers); set("s-pages", s.pages); set("s-lines", s.lines); set("s-chars", s.char_samples);
    set("s-hangul", s.distinct_hangul);
    const mine = s.languages && s.languages[here];
    if (mine) { set("s-lang-pages", mine.pages); set("s-lang-lines", mine.lines); }
  }).catch(() => {});
})();
