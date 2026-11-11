"""Practice sentences sent through issues: check every line and add those that pass to texts/<code>.tsv.

  python scripts/sentences.py check        reads $ISSUE_BODY and $ISSUE_NUMBER, writes texts/, comment.md and
                                           $GITHUB_OUTPUT (code, added, checked)
  python scripts/sentences.py try FILE CODE   all checks on the lines of FILE (writes nothing)

Issues come from the site's short forms (docs/site.js): "### Language" with "Name / Native (code)" and
"### Practice sentences", one sentence per line. A line is added only when it passes

  1. local checks: length, not a duplicate (in the issue or in texts/), no personal data patterns (as in
     validate.py), mostly in the language's own script, no word of the LDNOOBW list for the language
     (https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words, CC BY 4.0, pinned commit);
  2. spelling and grammar with LanguageTool's free public API (no key; about 30 languages, e.g. not Korean or
     Chinese: those pass on the local checks alone).

When LanguageTool cannot be reached nothing is added; editing the issue runs the check again.
The texts are CC BY 4.0 like the data: "sentence<TAB>issue number", so a line can be traced and removed.
"""
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import languages  # noqa: E402

MIN_LEN, MAX_LEN, MAX_LINES = 3, 150, 30
LT_URL = "https://api.languagetool.org/v2"           # free public API, no key (limits: 20 requests a minute)
LT_PREFERRED = {"en": "en-US", "pt": "pt-PT", "zh": "zh-CN", "ja": "ja-JP", "da": "da-DK", "uk": "uk-UA",
                "el": "el-GR", "ca": "ca-ES", "gl": "gl-ES", "ga": "ga-IE", "km": "km-KH", "ta": "ta-IN",
                "tl": "tl-PH", "be": "be-BY", "br": "br-FR", "ro": "ro-RO", "sl": "sl-SI", "sk": "sk-SK"}
LDNOOBW = ("https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/"
           "5faf2ba42d7b1c0977169ec3611df25a3c08eb13/")
LDNOOBW_FILES = {"ar", "cs", "da", "de", "en", "eo", "es", "fa", "fi", "fil", "fr", "hi", "hu", "it", "ja", "ko", "nl",
                 "no", "pl", "pt", "ru", "sv", "th", "tr", "zh"}
PRIVATE = [re.compile(p) for p in (r"[\w.+-]+@[\w-]+\.[\w.]+", r"https?://", r"www\.", r"\d[\d -]{6,}\d",
                                   r"\b\d{6}-?[1-4]\d{6}\b")]

# Unicode script (first word of the character name) that most letters of a line must use, by language code;
# languages not listed use LATIN.
SCRIPTS = {
    "ko": {"HANGUL"}, "ja": {"HIRAGANA", "KATAKANA", "CJK"}, "zh": {"CJK"}, "zh-hant": {"CJK"},
    "el": {"GREEK"}, "he": {"HEBREW"}, "yi": {"HEBREW"}, "th": {"THAI"}, "lo": {"LAO"}, "km": {"KHMER"},
    "my": {"MYANMAR"}, "ka": {"GEORGIAN"}, "hy": {"ARMENIAN"}, "am": {"ETHIOPIC"}, "ti": {"ETHIOPIC"},
    "bo": {"TIBETAN"}, "dz": {"TIBETAN"}, "si": {"SINHALA"}, "bn": {"BENGALI"}, "as": {"BENGALI"},
    "ta": {"TAMIL"}, "te": {"TELUGU"}, "kn": {"KANNADA"}, "ml": {"MALAYALAM"}, "gu": {"GUJARATI"},
    "pa": {"GURMUKHI"}, "or": {"ORIYA"}, "dv": {"THAANA"},
    **{c: {"DEVANAGARI"} for c in ("hi", "mr", "ne", "sa")},
    **{c: {"ARABIC"} for c in ("ar", "fa", "ur", "ug", "ps", "sd", "ku")},
    **{c: {"CYRILLIC"} for c in ("ru", "uk", "be", "bg", "sr", "mk", "kk", "ky", "tg", "mn", "ba", "tt", "cv", "ce")},
}
NO_SPACES = {"ja", "zh", "zh-hant", "th", "lo", "km", "my"}   # profanity words are matched inside the text


def sentences_of(body):
    text = languages.answer(body, "Practice sentences")
    out = []
    for line in text.splitlines():
        line = re.sub(r"^\s*(?:[-*•]|\d{1,2}[.)])\s+", "", line).strip()   # list bullets and numbers
        if line and not line.startswith("<!--"):
            out.append(line)
    return out[:MAX_LINES]


def script_ok(code, line):
    want = SCRIPTS.get(code, {"LATIN"})
    letters = [ch for ch in line if ch.isalpha()]
    if not letters:
        return False
    hits = sum(1 for ch in letters if unicodedata.name(ch, "").split(" ")[0] in want)
    return hits / len(letters) >= 0.7


def bad_words(code):
    f = "zh" if code == "zh-hant" else code
    if f not in LDNOOBW_FILES:
        return []
    try:
        with urllib.request.urlopen(LDNOOBW + f, timeout=20) as r:
            return [w.strip() for w in r.read().decode("utf-8").splitlines() if w.strip()]
    except Exception as e:  # the list is a safety net; the other checks still run
        print(f"LDNOOBW list for {f} not available: {e}", file=sys.stderr)
        return []


def has_bad_word(code, line, words):
    low = line.lower()
    for w in words:
        if code in NO_SPACES or code == "ko":       # no word boundaries (Korean: particles attach to words)
            if w.lower() in low:
                return w
        elif re.search(r"(?<!\w)" + re.escape(w.lower()) + r"(?!\w)", low):
            return w
    return None


def existing(code):
    f = ROOT / "texts" / f"{code}.tsv"
    if not f.exists():
        return set()
    return {l.split("\t")[0] for l in f.read_text(encoding="utf-8").splitlines() if l and not l.startswith("#")}


def local_checks(code, lines):
    """-> list of reasons ('' = passed) per line."""
    have = existing(code)
    words = bad_words(code)
    seen, out = set(), []
    for line in lines:
        reason = ""
        if not MIN_LEN <= len(line) <= MAX_LEN:
            reason = f"length {len(line)} (allowed {MIN_LEN}-{MAX_LEN} characters)"
        elif line in seen:
            reason = "repeated in this issue"
        elif line in have:
            reason = "already in the practice texts"
        elif any(p.search(line) for p in PRIVATE):
            reason = "looks like personal data (e-mail, link or number)"
        elif not script_ok(code, line):
            reason = "not written in the language's own script"
        elif has_bad_word(code, line, words):
            reason = "contains a word from the offensive-words list"
        seen.add(line)
        out.append(reason)
    return out


def lt_language(code):
    """LanguageTool's code for a language with spelling (a regional variant: de-DE, en-US, ...), or None."""
    try:
        with urllib.request.urlopen(LT_URL + "/languages", timeout=30) as r:
            have = {x["longCode"] for x in json.loads(r.read().decode("utf-8"))}
    except Exception as e:
        print(f"LanguageTool languages not available: {e}", file=sys.stderr)
        return False                                    # unknown: treat like an outage
    for c in (LT_PREFERRED.get(code), f"{code}-{code.upper()}"):
        if c and c in have:
            return c
    variants = sorted(c for c in have if c.startswith(code + "-"))
    return variants[0] if variants else (code if code in have else None)


def spelling_checks(code, lines):
    """LanguageTool (public API, no key): -> list of reasons ('' = passed) per line; None when the service could
    not be reached. Languages LanguageTool does not know pass without a spelling check (reason '')."""
    if not lines:
        return []
    lang = lt_language(code)
    if lang is False:
        return None
    if lang is None:
        return ["" for _ in lines]
    text = "\n\n".join(lines)
    starts, pos = [], 0
    for l in lines:
        starts.append(pos)
        pos += len(l) + 2
    data = urllib.parse.urlencode({"text": text, "language": lang}).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(LT_URL + "/check", data=data), timeout=60) as r:
            matches = json.loads(r.read().decode("utf-8"))["matches"]
    except Exception as e:
        print(f"LanguageTool check not available: {e}", file=sys.stderr)
        return None
    out = ["" for _ in lines]
    for m in matches:
        rule = m.get("rule", {})
        if rule.get("issueType") not in ("misspelling", "grammar") and rule.get("category", {}).get("id") not in ("TYPOS", "GRAMMAR"):
            continue                                    # style, punctuation, typography: not a reason to refuse
        i = max(k for k, st in enumerate(starts) if st <= m["offset"])
        word = text[m["offset"]:m["offset"] + m["length"]]
        if not out[i]:
            out[i] = f"{'spelling' if rule.get('issueType') == 'misspelling' else 'grammar'}: \"{word}\" ({lang})"
    return out


def run(body, issue):
    code, name, native = languages.parse_request(body)
    lines = sentences_of(body)
    if not code or not languages.valid(code):
        return code, 0, "n/a", ("No valid language code was found, so the sentences were not checked. / 언어 코드를 "
                                "찾지 못해 문장을 검사하지 않았습니다.")
    if not lines:
        return code, 0, "n/a", ""
    local = local_checks(code, lines)
    passed = [l for l, r in zip(lines, local) if not r]
    spell = spelling_checks(code, passed)
    verdict, it = [], iter(spell or [])
    for l, r in zip(lines, local):
        verdict.append(r if r else (next(it) if spell is not None else "waiting for the spelling check"))
    added = [l for l, r in zip(lines, verdict) if not r]
    if added:
        f = ROOT / "texts" / f"{code}.tsv"
        f.parent.mkdir(exist_ok=True)
        head = "" if f.exists() else ("# rmpp-hwr-db practice sentences, CC BY 4.0 (rmpp-hwr-db contributors). "
                                      "sentence<TAB>issue number; added by scripts/sentences.py\n")
        with f.open("a", encoding="utf-8", newline="\n") as out:
            out.write(head + "".join(f"{l}\t{issue}\n" for l in added))
    rows = "\n".join(f"| {i + 1} | {'✅' if not r else '❌'} | {r or 'added'} |" for i, r in enumerate(verdict))
    if spell is None:
        note = ("The spelling check (LanguageTool) could not run, so nothing was added yet. Edit the issue later to "
                "check again. / 맞춤법 검사(LanguageTool)를 실행하지 못해 아직 추가하지 않았습니다. 나중에 이슈를 "
                "편집하면 다시 검사합니다.")
    else:
        note = (f"{len(added)} of {len(lines)} sentences were added to the {name} practice texts "
                f"(`texts/{code}.tsv`). Edit the issue to fix a line and check it again. / {len(lines)}개 중 "
                f"{len(added)}개 문장을 연습 문장에 추가했습니다. 이슈를 고치면 다시 검사합니다.")
    comment = (f"Thanks for the sentences! / 문장 고맙습니다!\n\n{note}\n\n| line | | result |\n|---|---|---|\n{rows}\n\n"
               "Checks: length, duplicates, personal data, script, offensive words (LDNOOBW), spelling and grammar "
               "(LanguageTool, for the languages it knows).")
    return code, len(added), "no" if spell is None else "yes", comment


def main():
    if sys.argv[1:2] == ["check"]:
        code, added, checked, comment = run(os.environ.get("ISSUE_BODY", ""), os.environ.get("ISSUE_NUMBER", "0"))
        (ROOT / "comment.md").write_text(comment, encoding="utf-8")
        with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as f:
            f.write(f"code={code or ''}\nadded={added}\nchecked={checked}\n")
        print(comment)
    elif sys.argv[1:2] == ["try"] and len(sys.argv) == 4:
        lines = [l.strip() for l in Path(sys.argv[2]).read_text(encoding="utf-8").splitlines() if l.strip()]
        local = local_checks(sys.argv[3], lines)
        spell = iter(spelling_checks(sys.argv[3], [l for l, r in zip(lines, local) if not r]) or [])
        for l, r in zip(lines, local):
            r = r or next(spell, "spelling check not available")
            print(f"{'ok ' if not r else 'NO '} {l}  {r}")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
