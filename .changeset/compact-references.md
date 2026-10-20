---
"@macrostrat/data-components": minor
"@macrostrat/column-views": minor
---

`ReferenceList` lists references compactly, in the format of the Macrostrat website's lexicon pages: titles that link out in place of printed DOIs and URLs, long author lists shortened, parts of one volume (a drilling expedition's site reports) under its citation, and volumes of a series under the series' name. It takes the formatted citations v2 routes return beside their data; `citationText` gives the same form for a `/defs/refs` record. The parser (`parseReference`, `organizeReferences` and friends) is exported too. `column-views`' `ReferencesField` — the unit details panel, `ColumnBasicInfo` and the age model's surface details — now lists its references this way.
