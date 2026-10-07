---
"@macrostrat/column-views": minor
---

Columns can select several units at once with `allowMultipleSelection`: ⌘/Ctrl-click toggles a unit and Shift-click selects a run of units in a column. `onUnitsSelected` reports the selection, `selectedUnits` controls it, and `useSelectedUnits()` reads it. The selection dispatch takes an optional `mode` (`replace`, `toggle` or `range`). The selection highlight no longer intercepts clicks, so a selected unit can be clicked again.
