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
- `RowEditor`: a selection's fields as a form derived from the column spec
  (label, `valueRenderer`, `cellDetail` or a default editor by `dataType`,
  validation messages, per-field revert). Over several rows each field stands
  for that column across all of them — a shared value edited as one, "Multiple
  values" where they differ — and a change applies to every row. A column's
  `cellDetail` edits several cells only when the column declares `multiCell`
  (its context then carries `cells` and `mixed`); the default editors always do.
  Over a cell selection the selected columns are the focus, editable and marked,
  and the rest of the row is read-only context. `SelectedRowEditor` binds it to
  the sheet's store, following the selected rows and columns and writing through
  `onCellEdited`, so it works beside the grid or with the grid unmounted.
  `useSelectedRows()` / `useSelectedRow()` expose the binding.
- Stories: Locked and derived columns, Column visibility, Row editor (including
  several rows and a cell selection).
