---
"@macrostrat/column-views": minor
---

Add `useAnimatedAgeWindow`: animates a column/correlation-chart's rendered `t_age`/`b_age` for smooth pan-and-contract navigation at constant `pixelScale` (density), driving the existing clipping + zig-zag unit edges. Threads an `isTransitioning` flag through `Column`/`CorrelationChart` → `ColumnProvider` to suppress label reflows mid-animation. New stories for the correlation chart and a single stratigraphic column, each with a fixed-`pixelScale` variant.
