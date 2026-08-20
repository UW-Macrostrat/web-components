---
"@macrostrat/column-components": patch
---

Fix the notes column not re-laying-out on scale change: `NoteLayoutProvider` now re-filters notes to the visible domain and recomputes the vertical de-overlap when the column's scale/zoom changes, instead of only when the notes prop changes. Previously a zoom left notes at their prior positions, overlapping when zoomed out.
