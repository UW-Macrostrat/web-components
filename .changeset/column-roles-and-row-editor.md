---
"@macrostrat/data-sheet": minor
---

- `ColumnSpec.derived` and `ColumnSpec.hidden`: a derived column is computed
  from other values, never writable and drawn dimmed with a ƒ in its header; a
  hidden column stays in the spec but out of the table, so one spec serves every
  view and a control toggles flags on it.
- Column writability holds on every write path.
  `isColumnWritable(col, tableEditable)` is the one rule, and `onCellEdited`,
  `onSelectionEdited`, the fill handle, clear and clipboard paste (`editCells`)
  all apply it, so a locked or derived column is locked however an edit arrives
  — a paste across a selection used to write it. Deleted rows are skipped by
  fill and paste too.
- `RowEditor`: one row's fields as a form derived from the column spec (label,
  `valueRenderer`, `cellDetail` or a default editor by `dataType`, validation
  messages, per-field revert). `SelectedRowEditor` binds it to the sheet's
  store, following the selected row and writing through `onCellEdited`, so it
  works beside the grid or with the grid unmounted. `useSelectedRow()` exposes
  the binding for custom panels.
- Stories: Locked and derived columns, Column visibility, Row editor.
