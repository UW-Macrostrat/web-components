---
"@macrostrat/data-sheet": minor
---

The data panel's toolbar and filter/sort tags render through
`@macrostrat/ui-components`' `Toolbar` and `FilterTag`, so they share one look
with toolbars elsewhere; state and selection-aware actions are unchanged. New
`DataPanel` `toolbarCollapse` prop (default `never`). `MenuDropdown` and
`MenuFormItem` remain exported, now backed by `ToolbarDropdown` and
`MenuFormItem` from ui-components.
