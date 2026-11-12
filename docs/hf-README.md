---
license: cc-by-4.0
language:
- ko
- en
task_categories:
- image-to-text
tags:
- handwriting
- ocr
- online-handwriting
- multilingual
- remarkable
- community
pretty_name: rmpp-hwr-db
---

# rmpp-hwr-db

An open handwriting dataset built by the reMarkable community: people who write on a reMarkable Paper Pro fill in
practice notebooks in their own language (plus English and digits) and share them as pen strokes (x, y, pressure,
width, speed), on structured pages (one character per cell, English four-line rows, free lines, varied sizes).
Free for any use under CC BY 4.0: handwriting recognition, note apps, other devices, research, teaching.

This is a read-only mirror of https://github.com/lorancecall/rmpp-hwr-db, updated on every merge.
How to take part: https://lorancecall.github.io/rmpp-hwr-db/ (in every supported language)

- Format: `FORMAT.md` (`data/<language>/<uuid>/<session>/page-NN.json`; languages in `languages.json`: `ko` =
  Korean + English + digits, `en` = English + digits)
- Privacy: random writer ids only; no names, accounts, devices, document ids or timestamps.
- License: CC BY 4.0. Please credit "rmpp-hwr-db contributors".
