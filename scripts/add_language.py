"""Register a new language (after an accepted "Add a language" issue): languages.json entry and the
language's own page on the site, so the site grows with every language.

  python scripts/add_language.py CODE NAME NATIVE [--mix CODE,en,digits]

The new page starts as a copy of the English page (docs/index.html) marked "not translated yet"; replace its text
with a translation (keep the structure, the ids and the <script>). English stays the default page.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("code", help="ISO 639-1 code (two lowercase letters) or a variant listed in scripts/languages.py")
    ap.add_argument("name", help="English name, e.g. Japanese")
    ap.add_argument("native", help="the language's own name, e.g. 日本語")
    ap.add_argument("--mix", help="languages a practice notebook mixes (default: CODE,en,digits)")
    a = ap.parse_args()
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import languages
    if not languages.valid(a.code):
        raise SystemExit(f"{a.code} is not an ISO 639-1 code (or a known variant such as zh-hant)")
    lf = ROOT / "languages.json"
    langs = json.loads(lf.read_text(encoding="utf-8"))
    if a.code in langs:
        raise SystemExit(f"{a.code} is already in languages.json")
    mix = a.mix.split(",") if a.mix else [a.code, "en", "digits"]
    langs[a.code] = {"name": a.name, "native": a.native, "mix": mix, "page": f"{a.code}/"}
    lf.write_text("{\n" + ",\n".join(f" {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in langs.items())
                  + "\n}\n", encoding="utf-8", newline="\n")
    page = (ROOT / "docs" / "index.html").read_text(encoding="utf-8")
    page = page.replace('<html lang="en">', f'<html lang="{a.code}">', 1)
    page = page.replace('<main data-root="./">', '<main data-root="../">', 1)
    page = page.replace('<script src="site.js"></script>', '<script src="../site.js"></script>', 1)
    page = page.replace('<nav class="langs" id="langs" aria-label="Languages"></nav>',
                        '<nav class="langs" id="langs" aria-label="Languages"></nav>\n'
                        f'<p class="note">{a.native}: this page is not translated yet.</p>', 1)
    out = ROOT / "docs" / a.code / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8", newline="\n")
    print(f"added {a.code} ({a.name} / {a.native}), mix {'+'.join(mix)}: languages.json, {out.relative_to(ROOT)}; "
          f"data/{a.code}/ appears with the first contribution")


if __name__ == "__main__":
    main()
