"""Check a pull request before it can be merged.

  python scripts/validate.py --base origin/main [--author LOGIN] [--repo OWNER/NAME]

Rules (see FORMAT.md):
  * only files under data/<language>/<uuid>/ : writer.json and <session>/page-NN.json, for a language listed in
    languages.json (the repository owner's pull requests may change other files too)
  * the language folder matches the page's language mix (template.languages; missing = ["ko", "en", "digits"])
  * every record matches the format, with an allow-list of keys (nothing else can sneak in, e.g. names or times)
  * text fields look like practice prompts: no e-mail addresses, URLs or phone numbers
  * the writer's consent issue exists, carries the `consent-approved` label and was opened by the PR author
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

FORMAT = "rmpp-hwr-db/page@1"
UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
PATH_RE = re.compile(rf"^data/([a-z]{{2,8}})/({UUID})/(writer\.json|([0-9a-f]{{16}})/page-(\d\d)\.json)$")
LANGUAGES = json.loads(Path("languages.json").read_text(encoding="utf-8"))
OLD_MIX = ["ko", "en", "digits"]
WRITER_KEYS = {"writer", "consent_issue", "license", "handedness", "age_band"}
PAGE_KEYS = {"format", "writer", "session", "page", "template", "items", "assign", "strokes", "qc"}
TEMPLATE_KEYS = {"format", "page_px", "dpi", "seed", "page_kinds", "page_kind", "languages"}
ITEM_KEYS = {"id", "page", "kind", "layout", "size", "text", "box", "cells", "guides", "speed"}
ASSIGN_KEYS = {"id", "page", "strokes", "cells"}
QC_KEYS = {"id", "page", "text", "problems"}
PRIVATE = [re.compile(p) for p in (r"[\w.+-]+@[\w-]+\.[\w.]+", r"https?://", r"www\.", r"\b01[016789]-?\d{3,4}-?\d{4}\b",
                                   r"\b\d{6}-?[1-4]\d{6}\b")]
MAX_BYTES = 3_000_000


def fail(errors, path, msg):
    errors.append(f"{path}: {msg}")


def check_text(errors, path, s):
    for p in PRIVATE:
        if p.search(s):
            fail(errors, path, f"text looks like personal data: {s!r}")


def check_writer(errors, path, d, wid):
    if not isinstance(d, dict) or set(d) - WRITER_KEYS:
        fail(errors, path, f"unexpected keys {sorted(set(d) - WRITER_KEYS) if isinstance(d, dict) else d}")
        return
    if d.get("writer") != wid:
        fail(errors, path, "writer does not match the folder name")
    if d.get("license") != "CC-BY-4.0":
        fail(errors, path, "license must be CC-BY-4.0")
    if not isinstance(d.get("consent_issue"), int):
        fail(errors, path, "consent_issue (number of the join issue) is required")


def check_page(errors, path, d, lang, wid, session, pno):
    if not isinstance(d, dict) or set(d) != PAGE_KEYS:
        fail(errors, path, f"keys must be exactly {sorted(PAGE_KEYS)}")
        return
    if d["format"] != FORMAT:
        fail(errors, path, f"format must be {FORMAT}")
    if d["writer"] != wid or d["session"] != session or d["page"] != pno:
        fail(errors, path, "writer/session/page do not match the file path")
    t = d["template"]
    if not isinstance(t, dict) or set(t) - TEMPLATE_KEYS:
        fail(errors, path, "template has unexpected keys")
        return
    mix = t.get("languages", OLD_MIX)
    if mix != LANGUAGES[lang]["mix"]:
        fail(errors, path, f"template.languages {mix} does not match the folder data/{lang}/ ({LANGUAGES[lang]['mix']})")
    W, H = t.get("page_px", [0, 0])
    for it in d["items"]:
        if set(it) - ITEM_KEYS:
            fail(errors, path, f"item {it.get('id')} has unexpected keys {sorted(set(it) - ITEM_KEYS)}")
        check_text(errors, path, str(it.get("text", "")))
        for c in it.get("cells", []):
            if set(c) - {"char", "box"} or len(str(c.get("char", ""))) != 1:
                fail(errors, path, f"item {it.get('id')}: bad cell")
    for a in d["assign"]:
        if set(a) - ASSIGN_KEYS:
            fail(errors, path, "assign has unexpected keys")
    for q in d["qc"]:
        if set(q) - QC_KEYS:
            fail(errors, path, "qc has unexpected keys")
    n = len(d["strokes"])
    if n > 5000:
        fail(errors, path, f"too many strokes ({n})")
    for s in d["strokes"]:
        if set(s) != {"tool", "points"} or not isinstance(s["tool"], int):
            fail(errors, path, "stroke must be {tool, points}")
            break
        for p in s["points"]:
            if len(p) != 5 or not all(isinstance(v, (int, float)) for v in p):
                fail(errors, path, "point must be [x, y, pressure, width, speed]")
                break
            if not (-W / 2 - 200 <= p[0] <= W / 2 + 200 and -200 <= p[1] <= H + 200):
                fail(errors, path, "point outside the page")
                break


def gh_issue(repo, num):
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}/issues/{num}",
                                 headers={"Accept": "application/vnd.github+json",
                                          **({"Authorization": f"Bearer {os.environ['GH_TOKEN']}"} if os.environ.get("GH_TOKEN") else {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="origin/main")
    ap.add_argument("--author", help="PR author login (checks the consent issue)")
    ap.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", "lorancecall/rmpp-hwr-db"))
    ap.add_argument("--all", action="store_true", help="check every file, not only the changed ones")
    a = ap.parse_args()
    if a.all:
        files = [str(p.as_posix()) for p in Path("data").rglob("*.json")]
    else:
        out = subprocess.run(["git", "diff", "--name-only", "--diff-filter=ACMR", f"{a.base}...HEAD"],
                             capture_output=True, text=True, check=True).stdout
        files = [f for f in out.splitlines() if f]
    errors, writers = [], {}
    owner = a.author and a.author.lower() == a.repo.split("/")[0].lower()
    for f in files:
        m = PATH_RE.match(f)
        if not m:
            if owner and not f.startswith("data/"):
                continue          # the maintainer's own changes to scripts, docs, languages.json
            fail(errors, f, "only data/<language>/<uuid>/writer.json and data/<language>/<uuid>/<session>/page-NN.json may change")
            continue
        lang = m.group(1)
        if lang not in LANGUAGES:
            fail(errors, f, f"language '{lang}' is not in languages.json (ask for it with the 'add a language' issue form)")
            continue
        if Path(f).stat().st_size > MAX_BYTES:
            fail(errors, f, "file too large")
            continue
        try:
            d = json.loads(Path(f).read_text(encoding="utf-8"))
        except ValueError as e:
            fail(errors, f, f"not valid JSON ({e})")
            continue
        wid = m.group(2)
        if m.group(3) == "writer.json":
            check_writer(errors, f, d, wid)
        else:
            check_page(errors, f, d, lang, wid, m.group(4), int(m.group(5)))
        wj = Path("data") / lang / wid / "writer.json"
        if not wj.exists():
            fail(errors, f, "data/<language>/<uuid>/writer.json is missing")
        else:
            writers[wid] = json.loads(wj.read_text(encoding="utf-8"))
    if a.author:
        for wid, w in writers.items():
            try:
                iss = gh_issue(a.repo, w.get("consent_issue"))
            except Exception as e:  # noqa: BLE001
                fail(errors, f"writer {wid}", f"consent issue #{w.get('consent_issue')} not found ({e})")
                continue
            labels = {l["name"] for l in iss.get("labels", [])}
            if "consent-approved" not in labels:
                fail(errors, f"writer {wid}", f"consent issue #{iss['number']} is not approved yet")
            if iss["user"]["login"].lower() != a.author.lower():
                fail(errors, f"writer {wid}", "the consent issue must be opened by the same GitHub account as this PR")
    for e in errors:
        print("ERROR", e)
    print(f"checked {len(files)} file(s): {'OK' if not errors else f'{len(errors)} problem(s)'}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
