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
- korean
- remarkable
pretty_name: rmpp-hwr-db
---

# rmpp-hwr-db

Korean, English and digit handwriting written on the reMarkable Paper Pro, on structured practice pages
(one character per cell, English four-line rows, free lines, varied sizes), stored as pen strokes
(x, y, pressure, width, speed).

This is a read-only mirror of https://github.com/lorancecall/rmpp-hwr-db, updated on every merge.
How to take part: https://lorancecall.github.io/rmpp-hwr-db/ (English, with a page per language)

- Format: `FORMAT.md` (`data/<language>/<uuid>/<session>/page-NN.json`; languages in `languages.json`: `ko` =
  Korean + English + digits, `en` = English + digits)
- Privacy: random writer ids only; no names, accounts, devices, document ids or timestamps.
- License: CC BY 4.0. Please credit "rmpp-hwr-db contributors".
