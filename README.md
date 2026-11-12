# rmpp-hwr-db

An **open handwriting dataset built by the reMarkable community.** People who write on a reMarkable Paper Pro fill
in short practice notebooks in their own language and share what they wrote as pen strokes, so that anyone can use
it: for handwriting recognition research, for note apps and other tablets, for teaching, or for things nobody has
thought of yet. Everything is public under CC BY 4.0.

**Why.** Real pen-stroke handwriting (not scanned images) is rare, and most of what exists covers English and a few
large languages, or may only be used for research. A community that writes on paper-like tablets every day can
change that, one notebook at a time, in any language.

**What is collected.** Each notebook mixes the writer's language with English and digits, on structured pages (one
character per cell, English four-line rows, free lines, several sizes). Every stroke keeps its coordinates,
pressure and width, and every cell and line carries the text that was printed, so the data works for character-
and line-level training. Writers are random ids: no names, accounts or devices. The
[rmpp-hwr](https://github.com/lorancecall/rmpp-hwr) recognizer for the tablet is one user of the data; anyone else
is welcome to be the next.

- **How to take part**: https://lorancecall.github.io/rmpp-hwr-db/ (one page in every supported language, e.g.
  [한국어](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko); translations in `docs/i18n/<code>.json`)
- **Join**: [choose your language](https://lorancecall.github.io/rmpp-hwr-db/#start), then open its consent form
  (one issue form per language, `.github/ISSUE_TEMPLATE/join-<code>.yml`; the general
  [join form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=join.yml) still works)
- **Languages**: a practice notebook mixes the writer's language + English + digits; the data of each language is
  in `data/<code>/`. Supported: [languages.json](languages.json). Your language is missing? Use the
  ["Add a language" form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml) (or "My
  language isn't listed" on the site). A new language first collects 100 practice sentences; at 100 the sentences
  workflow registers it (`scripts/add_language.py`: languages.json, its join form) and it opens for joining.
- **Practice sentences**: anyone can send proverbs or sentences in their language from the site (a short form that
  opens an issue). `scripts/sentences.py` checks every line (length, duplicates, personal data, script, offensive
  words from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words), spelling
  and grammar with [LanguageTool](https://languagetool.org/) where it knows the language) and the workflow adds those
  that pass to `texts/<code>.tsv` (CC BY 4.0, with the issue number of each line).
- **Format**: [FORMAT.md](FORMAT.md)
- **Hugging Face mirror**: https://huggingface.co/datasets/lorancecall/rmpp-hwr-db

## Privacy

The data holds a random writer id, the practice template and the pen strokes: no names, accounts, device
information, document ids or times. Every pull request is checked by `scripts/validate.py` (allow-listed fields
only, no e-mail/URL/phone-number patterns, an approved consent issue). The GitHub account that opens the join
issue and the pull request is public, as on any GitHub project.

## License

The data is [CC BY 4.0](LICENSE). Please credit "rmpp-hwr-db contributors" and this repository.

---

**한국어.** reMarkable 커뮤니티가 함께 만드는 공개 손글씨 데이터셋입니다. reMarkable Paper Pro 사용자가 자기
언어로 짧은 연습 노트를 쓰고 펜 획 그대로 공유해, 누구나 손글씨 인식 연구, 노트 앱, 다른 태블릿 등 어디에든 자유롭게 쓸 수
있게 합니다(CC BY 4.0). 노트마다 내 언어, 영어, 숫자를 함께 쓰고, 언어마다 `data/<언어 코드>/` 폴더에 모입니다. 참여
안내는 [한국어 안내](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko)를 보세요. 다른 언어는
[언어 추가 요청](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml)으로 알려 주세요.
