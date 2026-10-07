---
"@macrostrat/column-views": minor
---

Columns can select several units at once with `allowMultipleSelection`:
⌘/Ctrl-click toggles a unit and Shift-click selects a run of units in a column.
`onUnitsSelected` reports the selection, `selectedUnits` controls it, and
`useSelectedUnits()` / `useHasUnitSelection()` read it. The selection dispatch
takes an optional `mode` (`replace`, `toggle` or `range`). The selection
highlight no longer intercepts clicks, so a selected unit can be clicked again.

Unit components take a `selectionStyle` (`UnitSelectionStyle`): `overlay` (a
wash and outline, the default), `outline`, `dim-others` (fades the units that
aren't selected) or `color-selected` (draws the units that aren't selected
without their background color). `Column` now passes `unitComponentProps`
through to its unit components; it was previously dropped.
