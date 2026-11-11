# Data format (`rmpp-hwr-db/page@1`)

One JSON file per handwritten page:

```
data/<language>/<writer uuid>/writer.json
data/<language>/<writer uuid>/<session>/page-NN.json
```

- **language**: the writer's language, a code listed in [`languages.json`](languages.json) (`ko`, `en`, ...). A
  practice notebook mixes it with English and digits (`mix` in `languages.json`: `ko` = Korean + English +
  digits, `en` = English + digits); its pages go to the folder of its first language. A writer who writes in
  two languages has a folder (and a `writer.json`) in each. New languages: the "Add a language" issue form.

- **writer uuid**: random UUID made once on the contributor's PC (`hwr-data/writer.json`). It is not derived from
  any account, device or name.
- **session**: 16 hex characters, a hash of the writer uuid and the local notebook; one practice notebook = one session.

## writer.json

| key | meaning |
|---|---|
| `writer` | the writer uuid (same as the folder) |
| `consent_issue` | number of the join issue (consent form) in this repository |
| `license` | always `CC-BY-4.0` |
| `handedness`, `age_band` | optional, only if the contributor sets them |

## page-NN.json

| key | meaning |
|---|---|
| `format` | `rmpp-hwr-db/page@1` |
| `writer`, `session`, `page` | as in the path |
| `template` | the practice template: `format` (`rmpp-hwr/practice@2`), `page_px` [1620, 2160], `dpi` 229, `seed`, `page_kinds`, `page_kind` of this page, `languages` (the mix, e.g. `["ko", "en", "digits"]`; pages made before mixes existed have no `languages` and are Korean + English + digits) |
| `items` | what was printed on the page: rows of cells (`kind: row`, `cells: [{char, box}]`) or lines (`kind: line`, `guides`), each with `text`, `layout` (`grid`, `digits`, `english`, `free`), `size` (`S`, `M`, `L`), `box`, optional `speed` (`fast`) |
| `assign` | which strokes belong to each item (`strokes`: indices into `strokes`) and, for rows, to each cell (`cells`: list of index lists) |
| `strokes` | pen strokes in writing order: `tool` (reMarkable pen type) and `points` `[x, y, pressure, width, speed]` |
| `qc` | automatic checks from the PC tool: empty cells, strokes crossing into the next cell, ... |

Coordinates are reMarkable page units: 1 unit = 1 px at 229 dpi, `x` centred on the page (−810 … 810), `y` from
the top (0 … 2160). Boxes are `[x0, y0, x1, y1]` in the same units.

There are no timestamps, document ids, file names, device information or account names in the data.

## Using it

- **Line images**: render the strokes of one item (row or line) and use `text` as the label.
- **Character images**: render the strokes of one cell and use its `char`.
- **Online recognition**: use the point sequences directly.

The renderer used by rmpp-hwr (disc stamps every 0.5 px, pen width 4, height 48 for recognition) is in
`rmpp-hwr/collect/collect.py` (`render`).
