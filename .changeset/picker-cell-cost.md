---
"@macrostrat/data-components": minor
---

Cheaper pickers in table cells:
- `TagPicker` (and the lithology, environment and interval pickers) take `layoutWidth`: given the width its container lays it out in — a table cell's, from `CellRenderContext.width` — a one-line row re-fits when that changes instead of observing its own size. Without it, rows share a single `ResizeObserver`, and wrapping rows aren't observed
- A single-valued picker skips the overflow measure: its one tag is shown, clipped if need be
- Vocabularies are indexed once per version and shared by every picker (`useVocabularyIndex`), so a cell looks its item up by id instead of copying and searching the whole list; the interval editor's age-sorted list is built once per timescale, and only for an editor
