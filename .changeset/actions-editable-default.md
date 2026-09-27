---
"@macrostrat/data-sheet": minor
---

- `requiresEditable` defaults to `true` everywhere, as its type documents (the toolbar and data editor read an unset flag as `false`, the hotkeys as `true`); filter and sort controls say `false` explicitly. An action meant for view mode must now set `requiresEditable: false`
- The actions toolbar rebuilds its action context when the rows change, not only the selection, so `getSelectedRows()` is current just after a row is added and selected
- The `deleteRows` edit event carries the deleted `rows`: rows the table added are spliced out before it is reported, so their indices can't be looked up afterwards
- `CellRenderContext` carries the cell's `width` and `height` (the column's width, resizes included, and the row's height), so a renderer that fits itself to the cell needn't measure; cell content re-renders when they change
