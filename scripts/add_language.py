"""Register a new language (after an accepted "Add a language" issue): languages.json entry (the site lists it
and can be shown in it) and its own join form, so the site grows with every language.

  python scripts/add_language.py CODE NAME NATIVE [--mix CODE,en,digits]

The site shows the language in English until docs/i18n/<code>.json translates it (same keys as docs/i18n/ko.json).
The language gets its own join form (.github/ISSUE_TEMPLATE/join-<code>.yml, from join-en.yml), which the site links to.
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
    langs[a.code] = {"name": a.name, "native": a.native, "mix": mix}
    lf.write_text("{\n" + ",\n".join(f" {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in langs.items())
                  + "\n}\n", encoding="utf-8", newline="\n")
    forms = update_forms(a.code, a.name, a.native)
    print(f"added {a.code} ({a.name} / {a.native}), mix {'+'.join(mix)}: languages.json"
          f"{''.join(', ' + f for f in forms)}; data/{a.code}/ appears with the first contribution")


def join_form(code, name, native):
    """join-<code>.yml: the English join form (join-en.yml) with this language fixed, labelled lang:<code>. The site
    links every language's join button straight to its own form. The text stays English until translated."""
    label = f"{name} / {native} ({code})" if native != name else f"{name} ({code})"
    src = (ROOT / ".github" / "ISSUE_TEMPLATE" / "join-en.yml").read_text(encoding="utf-8")
    out = []
    for line in src.split("\n"):
        if line.startswith("#"):
            continue                                    # the note about this copy belongs to join-en.yml only
        if line.startswith("name: "):
            line = f'name: "Join: {native} ({name})"' if native != name else f'name: "Join: {name}"'
        elif line.startswith("description: "):
            line = f"description: Join the open handwriting dataset writing {name} + English + digits"
        line = line.replace("English (en)", label).replace('"lang:en"', f'"lang:{code}"')
        line = line.replace("rmpp-hwr-db/#start", f"rmpp-hwr-db/?lang={code}#start")
        out.append(line)
    return "\n".join(out)


def update_forms(code, name, native):
    """A join form of its own (join-<code>.yml); the general join form lists the language too (above its last
    option, 'Another language'); the language request form stops offering it. Returns the files changed."""
    tpl = ROOT / ".github" / "ISSUE_TEMPLATE"
    changed = []
    own = tpl / f"join-{code}.yml"
    if not own.exists():
        own.write_text(join_form(code, name, native), encoding="utf-8", newline="\n")
        changed.append(str(own.relative_to(ROOT)))
    join = tpl / "join.yml"
    lines = join.read_text(encoding="utf-8").split("\n")
    opt = f'        - "{name} / {native} ({code})"' if native != name else f'        - "{name} ({code})"'
    last = next((i for i, l in enumerate(lines) if l.startswith('        - "Another language')), None)
    if last is not None and opt not in lines:
        lines.insert(last, opt)
        join.write_text("\n".join(lines), encoding="utf-8", newline="\n")
        changed.append(str(join.relative_to(ROOT)))
    req = tpl / "language.yml"
    lines = req.read_text(encoding="utf-8").split("\n")
    kept = [l for l in lines if not (l.startswith('        - "') and l.rstrip().endswith(f'({code})"'))]
    if len(kept) != len(lines):
        req.write_text("\n".join(kept), encoding="utf-8", newline="\n")
        changed.append(str(req.relative_to(ROOT)))
    return changed


if __name__ == "__main__":
    main()
