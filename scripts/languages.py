"""Language codes shared by rmpp-hwr-db, rmpp-hwr and rmpp-lang: ISO 639-1 (two lowercase letters), plus the
script variants used here (zh-hant). Used by scripts/add_language.py and the "Add a language" issue check.

  python scripts/languages.py check-issue      reads the issue body from $ISSUE_BODY, writes $GITHUB_OUTPUT
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ISO_639_1 = set("""
aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo
es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka
kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng
nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su
sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu
""".split())
VARIANTS = {"zh-hant"}          # Traditional Chinese characters (zh = Simplified)


def valid(code):
    return code in ISO_639_1 or code in VARIANTS


def answer(body, heading):
    """Text under '### <heading...>' in a GitHub issue form body."""
    m = re.search(r"^###\s*" + re.escape(heading) + r".*?\n\s*\n(.*?)(?=\n###|\Z)", body, re.S | re.M)
    v = m.group(1).strip() if m else ""
    return "" if v == "_No response_" else v


def check_issue(body):
    """-> (code or None, comment). Code from the dropdown '... (xx)' or, for Other, the first word of the input."""
    known = json.loads((ROOT / "languages.json").read_text(encoding="utf-8"))
    choice = answer(body, "Language")
    other = answer(body, "Only for Other")
    m = re.search(r"\(([a-z]{2}(?:-[a-z]{2,4})?)\)\s*$", choice)
    code = m.group(1) if m else (other.split()[0].lower() if other.split() else "")
    if not code:
        return None, ("Please pick a language, or choose Other and write its ISO 639-1 code (two lowercase letters) "
                      "and name. / 언어를 고르거나, 기타를 고르고 ISO 639-1 코드(소문자 두 글자)와 이름을 적어 주세요.")
    if not valid(code):
        return None, (f"`{code}` is not an ISO 639-1 code (two lowercase letters, "
                      "https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes). Please edit the issue. / "
                      f"`{code}`는 ISO 639-1 코드가 아닙니다. 이슈를 고쳐 주세요.")
    if code in known:
        return code, (f"`{code}` ({known[code].get('name')}) is supported already: "
                      f"https://lorancecall.github.io/rmpp-hwr-db/{known[code].get('page', '')} / 이미 지원하는 언어입니다.")
    return code, (f"Thanks! Requested language code: `{code}`. A maintainer will review the characters and the practice "
                  f"texts. / 요청 언어 코드: `{code}`. 관리자가 문자 범위와 연습 문장을 검토합니다.")


if __name__ == "__main__":
    if sys.argv[1:] == ["check-issue"]:
        code, comment = check_issue(os.environ.get("ISSUE_BODY", ""))
        with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as f:
            f.write(f"code={code or ''}\n")
            f.write("comment<<EOF\n" + comment + "\nEOF\n")
        print(code, comment)
    else:
        sys.exit(__doc__)
