---
"@macrostrat/column-components": minor
---

Add `isTransitioning` to `ColumnContext`/`ColumnProvider` so consumers can skip expensive per-frame recalculation (label measurement, `foreignObject` reflows) while a column's scale/age-window is animating.
