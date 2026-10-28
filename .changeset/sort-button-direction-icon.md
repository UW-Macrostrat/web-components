---
"@macrostrat/data-sheet": patch
---

`DataPanel`'s sort controls show the sort's direction in their icon: ascending
is an up arrow with `sort-asc`'s lines, descending a down arrow with
`sort-desc`'s lines — on the toolbar's Sort button (following the
highest-priority sort), its menu items, sort tags and a tag's
Ascending/Descending menu. Blueprint's
`sort-asc`/`sort-desc` reorder the lines but keep the same down arrow. Exported
as `SortDirectionIcon` and `sortIcon(sort)`
