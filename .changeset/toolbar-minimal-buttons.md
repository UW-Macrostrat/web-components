---
"@macrostrat/data-sheet": patch
---

Toolbar + filter presentation:

- **`TableFilter.presentation`** (`"menu"` | `"menu-inline"` | `"inline"`) — progressive enhancement over the same `filterForm`, choosing where a filter surfaces without changing its state/wiring:
  - `"menu"` (default): a menu item whose submenu holds the form (today's behavior).
  - `"menu-inline"`: the form renders directly in the Filter menu (no submenu) — for compact controls like a segmented picker.
  - `"inline"`: the form renders as an always-visible toolbar control (no menu) — for a common always-on control like a text search.
- **`DataPanel` now surfaces the table-level `filters` prop** (previously dropped), splitting them by `presentation` — inline filters become always-visible toolbar controls, the rest join the "Filter" menu. Column-declared filters are unchanged (default `"menu"`).
- New exports: **`InlineFilterControl`** (renders any filter's `filterForm` inline, wired to the shared filter state) and **`MenuInlineFilterItem`** (renders a filter's form directly in a menu).
- Action buttons (`RunActionButton` + the details-form trigger) render `minimal` + `small`, matching the toolbar's other controls; and `ActionsToolbar` renders when given custom `children` even with no displayable actions.
- **`DataPanel` title** is now `compact`: it renders only when modal selection is toggle-able (or a selection is active), since the title doubles as the modal-selection control — no bare label when selection is off.
- **Flat sort menu** — `ColumnSortMenu` is a single item (no Ascending/Descending submenu): direction shows as an icon, an active sort reads through the `primary` intent, clicking toggles the direction, and a right-aligned ✕ clears it.
- **Explicit empty `columnSpec` is respected** — an explicitly-passed spec (function or array, *including `[]`*) now suppresses the loader's first-chunk auto-generation. `columnSpec: []` means "no facet columns" (e.g. a browse panel whose only control is a sheet-level filter), not "generate from the data". Auto-gen still runs when no `columnSpec` is passed.
