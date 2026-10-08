---
"@macrostrat/column-views": patch
---

`UnitComponent` respects `maxInternalColumns`: overlapping units spread across at most that many internal columns, sharing the last one past the cap. It had taken the count from the overlap layout alone, so `maxInternalColumns: 1` still split a section whose units overlap at their boundaries into two columns. A unit without a layout now takes its full width instead of one as many pixels wide as `nColumns`.
