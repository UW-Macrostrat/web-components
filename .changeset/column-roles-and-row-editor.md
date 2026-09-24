---
"@macrostrat/data-sheet": minor
---

Column roles, a row editor, and a standalone data editor

- `ColumnSpec.derived` / `hidden` — computed, read-only columns and columns kept out of the table; writability enforced on every write path
- `RowEditor` / `SelectedRowEditor` — the selection's fields as a form, over one row or several, in a panel titled "Editing 3 rows"
- `rowEditorOpenAtom`, `ShowRowEditor`, `showRowEditorAction` — toggle the row editor from the toolbar
- `DataEditor` — standalone form over one record from a data spec, with Reset/Save and table actions scoped to the record and its fields
- `SelectedDataEditor` — a `DataEditor` over a panel's selected row, saving through the provider
- `CellDetailContext` — `surface`, `onChangeCells`; `ColumnSpec.detailPlacement`, `cellLabel`
- `cellInteraction: "second-click"`; `TableAction.placement: "end"`
- Selection indicator names single-column cells by column ("3 lithologies"); `pluralize` handles more English plurals
- Tags in cells are pinned to the row height
- Fix: Backspace in a cell popover's text field cleared the cell
