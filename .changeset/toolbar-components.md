---
"@macrostrat/ui-components": minor
---

Add `Toolbar`, a layout-only bar of controls for any page or content model:
`placement` (`inline` | `sticky` | `floating` | `fixed`), `anchor`, `align`,
`surface` (`plain` | `bordered` | `raised`), `density` (`expanded` | `compact` |
`collapsed`, shared with its contents through `useToolbarDensity`) and
`collapse` (`narrow` | `never`). Items keep their order, may be `pinned` or
`grow` (a search field that shrinks in step as labels drop and items fold into a
"more" popover by priority). Also `ToolbarButton` (`PageHeaderButton` is now an
alias), `ToolbarDropdown` (a non-focus-trapping dropdown), `FilterTag` (the
shared filter/sort/view-control tag) and `MenuFormItem`, and the
`useIsomorphicLayoutEffect` helper.
