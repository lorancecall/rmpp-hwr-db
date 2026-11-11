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


# Support tiers for a requested language (what rmpp-hwr can do with it, and what is missing).
TIER_A = {"ko", "en"}                                  # recognition model + ink font + keyboard work now
PADDLE = {  # PaddleOCR recognition models exist (printed text; handwriting needs fine-tuning on practice data)
    "ja", "zh", "zh-hant", "ru", "uk", "be", "bg", "sr", "mk", "kk", "ky", "tg", "mn", "ar", "fa", "ur", "ug", "hi",
    "mr", "ne", "sa", "ta", "te", "kn", "ka", "el", "th",
    "de", "fr", "es", "pt", "it", "nl", "pl", "sv", "da", "no", "nb", "nn", "fi", "is", "cs", "sk", "sl", "hr", "bs",
    "hu", "ro", "et", "lv", "lt", "tr", "az", "uz", "vi", "id", "ms", "tl", "sw", "af", "ga", "cy", "eu", "ca", "gl",
    "la", "eo", "sq", "mt", "oc", "rm", "lb", "fo", "mi", "so", "ku"}
LAYOUT = {  # ink/text layout needs work: right-to-left, or shaped scripts (glyphs are placed one by one today)
    "ar", "fa", "ur", "ug", "ps", "sd", "ku", "he", "yi", "dv", "hi", "mr", "ne", "sa", "bn", "as", "pa", "gu", "or",
    "ta", "te", "kn", "ml", "si", "th", "lo", "km", "my", "bo", "dz"}
IME = {"ja", "zh", "zh-hant"}                          # typing needs a conversion input method (rmpp-lang)


def tier(code):
    """One-paragraph support summary (English / Korean) for the issue reply."""
    if code in TIER_A:
        return "Tier A: works now (recognition, ink, keyboard). / A: 지금 바로 동작합니다."
    parts = []
    if code in PADDLE:
        parts.append("Recognition, tier B: a base recognition model exists; it learns handwriting from the practice "
                     "pages people write. / 인식 B: 기본 인식 모델이 있고, 연습 페이지 손글씨로 학습시킵니다.")
    else:
        parts.append("Recognition: no base model yet; a new one is trained from the collected pages. / "
                     "인식: 기본 모델이 없어 모인 페이지로 새로 학습해야 합니다.")
    if code in LAYOUT:
        parts.append("Ink, tier C: right-to-left or shaped script; ink places glyphs one by one, so it needs layout "
                     "(shaping) work. / 잉크 C: 오른쪽에서 왼쪽 또는 글자 모양이 바뀌는 문자라 배치(셰이핑) 작업이 필요합니다.")
    else:
        parts.append("Ink: needs a glyph file for this language, made from the font rmpp-lang sets for it. / "
                     "잉크: rmpp-lang이 정한 글꼴로 이 언어의 글리프 파일을 만들어야 합니다.")
    parts.append("Typing: needs a conversion input method in rmpp-lang. / 입력: rmpp-lang에 변환 입력기가 필요합니다."
                 if code in IME else
                 "Typing: needs a keyboard layout add-on in rmpp-lang. / 입력: rmpp-lang 키보드 배열 add-on이 필요합니다.")
    return "\n".join("- " + p for p in parts)


def parse_request(body):
    """-> (code, name, native) from the issue: 'Name / Native (code)' or 'Name (code)' under Language (the form's
    dropdown, or the site's request form), else 'code Name / Native' under Other language."""
    choice = answer(body, "Language")
    other = answer(body, "Other language") or answer(body, "Only for Other")    # label before the site flow
    m = re.match(r"\s*(.+?)\s*(?:/\s*(.+?))?\s*\(([a-z]{2}(?:-[a-z]{2,4})?)\)\s*$", choice)
    if m:
        return m.group(3), m.group(1), m.group(2) or m.group(1)
    m = re.match(r"\s*([A-Za-z-]+)\s+(.+?)\s*(?:/\s*(.+?))?\s*$", other)
    if m:
        return m.group(1).lower(), m.group(2), m.group(3) or m.group(2)
    return "", "", ""


def check_issue(body):
    """-> (code or None, name, native, comment, new). new = the language is not registered yet."""
    known = json.loads((ROOT / "languages.json").read_text(encoding="utf-8"))
    code, name, native = parse_request(body)
    if not code:
        return None, "", "", ("Please pick a language, or choose Other and write its ISO 639-1 code (two lowercase "
                               "letters), English name and own name, e.g. `ka Georgian / ქართული`. / 언어를 고르거나, "
                               "기타를 고르고 코드, 영어 이름, 자기 언어 이름을 적어 주세요."), False
    if not valid(code):
        return None, "", "", (f"`{code}` is not an ISO 639-1 code (two lowercase letters, "
                               "https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes). Please edit the issue. / "
                               f"`{code}`는 ISO 639-1 코드가 아닙니다. 이슈를 고쳐 주세요."), False
    if code in known:
        return code, name, native, (f"`{code}` ({known[code].get('name')}) is supported already: "
                                    f"https://lorancecall.github.io/rmpp-hwr-db/{known[code].get('page', '')} / "
                                    "이미 지원하는 언어입니다.\n\n" + tier(code)), False
    return code, name, native, (f"Thanks! Requested: **{name} / {native}** (`{code}`). A pull request adds its page on the "
                                "site and its join form; practice texts follow after review. When it is merged, the "
                                "language shows up at https://lorancecall.github.io/rmpp-hwr-db/#start and you can join. "
                                "Subscribe to this issue for updates. / 요청 언어의 사이트 페이지와 참여 양식을 PR로 "
                                "추가하고, 연습 문장은 검토 후 이어집니다. 합쳐지면 사이트의 언어 목록에 나타나 참여할 수 "
                                "있습니다.\n\n" + tier(code)), True


if __name__ == "__main__":
    if sys.argv[1:] == ["check-issue"]:
        code, name, native, comment, new = check_issue(os.environ.get("ISSUE_BODY", ""))
        with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as f:
            f.write(f"code={code or ''}\nname={name}\nnative={native}\nnew={'1' if new else ''}\n")
            f.write("comment<<EOF\n" + comment + "\nEOF\n")
        print(code, comment)
    else:
        sys.exit(__doc__)
