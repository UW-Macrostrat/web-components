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
- `SelectedRowEditor` is a panel (`panel`, on by default; `RowEditor` takes it
  too, with `title` and `onClose`). Its title bar is the toolbar's selection tag
  at full width, naming what it does to how many of the sheet's items ("Editing
  3 rows", "Viewing 1 unit", after `itemLabel`); the tag's ✕ clears the
  selection (`closeable`). With nothing selected it shows a `NonIdealState` ("No
  units selected"). The columns a cell selection falls in are outlined as the
  table outlines a selection. `RowEditorFrame` is exported.
- The row editor can be switched on and off from the toolbar:
  `rowEditorOpenAtom` (with `useRowEditorOpen`) holds whether it is shown,
  `ShowRowEditor` toggles it, and `showRowEditorAction` puts that toggle in a
  sheet's toolbar, wherever the editor itself is mounted. `SelectedRowEditor`
  follows it (`toggleable`).
- `TableAction.placement: "end"` puts an action at the toolbar's fixed end,
  beside Save and Reset.
- `cellInteraction: "second-click"`: a click selects a cell and a second click
  (or Enter, F2) opens its surface — for a sheet whose selection feeds a row
  editor.
- `ColumnSpec.detailPlacement`: where a popover `cellDetail` opens against its
  cell (default `right-start`).
- `CellDetailContext.surface`: `"cell"` or `"row-editor"`, so one `cellDetail`
  can lay itself out for either.
- Clicking a row-editor field selects its cells in the sheet; the field is
  marked, and the form stays whole rather than narrowing to it.
  `CellDetailContext.onChangeCells` writes a value to each of a multi-row
  surface's cells (`RowEditor`'s `onChangeCells`).
- A cell selection in one column is named for what the column holds ("1
  lithology", "3 lithologies"; `ColumnSpec.cellLabel` overrides the column's
  name), and `pluralize` handles `-y`, `-s`/`-x`/`-ch`/`-sh` and a trailing
  parenthetical.
- Tags in a cell are pinned inside it — a tighter line height, one line centred
  clear of the cell's border — and outlined in the selected cell.
- `DataEditor`: a standalone form over one record from a data spec (any column
  spec is one), keeping its own edits (or controlled `edits`), with Reset and
  Save in a footer (`onSave`; Save waits for edits and for no errors). Its
  `actions` are table actions scoped to the form (`editorActionsFor`,
  `editorActionContext`, `EditorActionButton`): those for a row act on the
  record, in the footer; those for a cell or column, and a field's column
  `actions`, act on one field, beside its label; `showActions` turns them off.
  It has no field selection. The row editor is built on its parts —
  `DataEditorFields`, `DataEditorFrame`, `DataEditorField` — which are exported;
  `CellDetailContext.surface` gains `"editor"`.
- `SelectedDataEditor`: a `DataEditor` over a sheet's or panel's single selected
  row, saving it through the provider (`rowEditing.saveRows`) — the
  immediate-edit counterpart of `SelectedRowEditor`, for a `DataPanel`'s
  sidebar.
- Fix: typing in a text field inside a cell's popover surface no longer reaches
  the sheet's hotkeys, which run inside inputs — Backspace in a surface's search
  box cleared the cell, and Enter moved off it.
- Stories: Locked and derived columns, Column visibility, Row editor (including
  several rows and a cell selection), and the vocabulary pickers of
  `@macrostrat/data-components` as a units sheet's column surfaces.
