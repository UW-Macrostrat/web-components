---
"@macrostrat/data-components": patch
---

Cheaper pickers in table cells: one-line tag rows share a single `ResizeObserver` (and wrapping rows aren't observed), and a read-only `IntervalPositionEditor` no longer sorts the whole interval vocabulary
