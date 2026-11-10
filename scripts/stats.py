"""Dataset statistics for the web page and the README: writers, pages, lines, characters, per-character coverage.

  python scripts/stats.py > docs/stats.json
"""
import collections
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

writers, sessions, pages, lines, cells = set(), set(), 0, 0, 0
kinds = collections.Counter()
chars = collections.Counter()
for f in sorted(Path("writers").glob("*/*/page-*.json")):
    d = json.loads(f.read_text(encoding="utf-8"))
    writers.add(d["writer"]); sessions.add(d["session"]); pages += 1
    kinds[d["template"].get("page_kind", "?")] += 1
    assign = {a["id"]: a for a in d["assign"]}
    for it in d["items"]:
        a = assign.get(it["id"])
        if not a or not a["strokes"]:
            continue
        lines += 1
        for cl, cs in zip(it.get("cells", []), a.get("cells", [])):
            if cl["char"] != " " and cs:
                cells += 1
                chars[cl["char"]] += 1
hangul = [c for c in chars if "가" <= c <= "힣"]
print(json.dumps({
    "writers": len(writers), "sessions": len(sessions), "pages": pages, "lines": lines, "char_samples": cells,
    "distinct_chars": len(chars), "distinct_hangul": len(hangul), "page_kinds": dict(kinds),
    "top_chars": chars.most_common(30),
}, ensure_ascii=False, indent=1))
