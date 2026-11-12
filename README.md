# rmpp-hwr-db

An **open handwriting dataset** written on the reMarkable Paper Pro: each writer's language plus English and
digits, on structured practice pages (one character per cell, English four-line rows, free lines), stored as pen
strokes (coordinates, pressure, width). The data is used for line- and character-level training, and the
[rmpp-hwr](https://github.com/lorancecall/rmpp-hwr) recognition models are trained on it regularly.

- **How to take part**: https://lorancecall.github.io/rmpp-hwr-db/ (one page in every supported language, e.g.
  [한국어](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko); translations in `docs/i18n/<code>.json`)
- **Join**: [choose your language](https://lorancecall.github.io/rmpp-hwr-db/#start), then open its consent form
  (one issue form per language, `.github/ISSUE_TEMPLATE/join-<code>.yml`; the general
  [join form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=join.yml) still works)
- **Languages**: a practice notebook mixes the writer's language + English + digits; the data of each language is
  in `data/<code>/`. Supported: [languages.json](languages.json). Your language is missing? Use the
  ["Add a language" form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml); an accepted
  language gets its practice texts, its data folder and its place on the site (`scripts/add_language.py`).
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

**한국어.** reMarkable Paper Pro로 쓴 손글씨 공개 데이터셋입니다. 노트마다 내 언어, 영어, 숫자를 함께 연습하고,
언어마다 `data/<언어 코드>/` 폴더에 따로 모입니다. 참여 안내는 [한국어 안내](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko)를
보세요. 다른 언어는 [언어 추가 요청](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml)으로
알려 주세요. 데이터는 CC BY 4.0입니다.
