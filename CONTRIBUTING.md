# Contributing to rmpp-hwr-db

The step-by-step guide for writers is the site, in every supported language:
https://lorancecall.github.io/rmpp-hwr-db/ (translations in `docs/i18n/<code>.json`). This page is the overview.

## Handwriting

1. **Join**: [choose your language](https://lorancecall.github.io/rmpp-hwr-db/#start) and open its consent form
   (one issue form per language, `.github/ISSUE_TEMPLATE/join-<code>.yml`; the general
   [join form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=join.yml) works too). A bot checks
   the answers and replies with the issue number to use.
2. **Write**: install [rmpp-hwr](https://github.com/lorancecall/rmpp-hwr) on the Paper Pro with
   [rmpp setup](https://github.com/lorancecall/rmpp-packages#install) and its `hwr` tool on the computer, get a practice notebook
   (`hwr practice`), write it on the Paper Pro, then `hwr pull` and `hwr qc`.
   rmpp-hwr is made for and tested on the reMarkable Paper Pro with OS 3.29 only; other models are not supported
   (see [rmpp-packages](https://github.com/lorancecall/rmpp-packages#readme)).
3. **Send**: `hwr contribute --consent <issue number>` the first time, `hwr contribute` after that. It opens a
   pull request with the anonymized pages; `scripts/validate.py` checks it and a maintainer merges it.

A notebook mixes the writer's language with English and digits; each language's data goes to `data/<code>/`.

## Languages

Supported languages are in [languages.json](languages.json). Missing yours? Use the
["Add a language" form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=language.yml) or "My
language isn't listed" on the site. A new language first collects 100 practice sentences; at 100 the sentences
workflow registers it (`scripts/add_language.py`: languages.json entry, its join form) and it opens for joining.

## Practice sentences

Anyone can send proverbs or sentences in their language from the site (a short form that opens a `[sentences]`
issue). `scripts/sentences.py` checks every line: length, duplicates, personal data patterns, the language's own
script, offensive words from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words),
spelling and grammar with [LanguageTool](https://languagetool.org/) where it knows the language. Lines that pass
are added to `texts/<code>.tsv` (format: [FORMAT.md](FORMAT.md#practice-sentences-textscodetsv)), and rmpp-hwr uses
them as practice texts.

## What the bots do

| Workflow | When | What |
|---|---|---|
| `consent.yml` | join issue | checks the consent answers, labels the language, replies |
| `validate.yml` | pull request | `scripts/validate.py`: allow-listed fields only, no personal data patterns, an approved consent issue |
| `sentences.yml` | `[sentences]` issue | checks the lines, commits passing ones to `texts/`, registers a language at 100 |
| `language-request.yml` | language request | labels it and replies with how far the language is |
| `publish.yml` | push to main | the site (`docs/`, `stats.json`) and the Hugging Face mirror |
