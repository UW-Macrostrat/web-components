---
"@macrostrat/column-views": minor
"@macrostrat/column-components": patch
---

- `Column` hatches units marked `covered` (present but unexposed), drawing column-components' `CoveredOverlay` over each section's units
- `CoveredOverlay` takes its `divisions` as a prop when given (sized by `top` / `bottom`), and lets pointer events through to what is beneath
- `ColumnRect` draws a division the right way up on an age or depth axis (which grow downwards), not only on a height axis
