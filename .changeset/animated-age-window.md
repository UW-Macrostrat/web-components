---
"@macrostrat/column-views": minor
---

Add `useAnimatedAgeWindow`: animates a column/correlation-chart's rendered `t_age`/`b_age` for smooth pan-and-contract navigation at constant `pixelScale` (density), driving the existing clipping + zig-zag unit edges. Threads `isTransitioning` / `hideLabelsWhileTransitioning` flags through `Column`/`CorrelationChart` → `ColumnProvider`; labels stay visible through the animation by default, with an opt-in toggle to hide them. New stories for the correlation chart and a single stratigraphic column, each with a fixed-`pixelScale` variant and a label-hiding toggle.

Stabilize composite-scale package keys (positional index instead of `package-${b_age}-${t_age}`) so the correlation chart's packages, columns, and timescale reconcile instead of remounting on every animation frame. Unit labels re-fit when a transition settles (via `SizeAwareLabel`'s `remeasureKey`), not on intermediate frames.

Add a bounded-density story demonstrating `pixelScale` derived from the visible age span, keeping the rendered column height within a floor/cap as the window ranges from a narrow interval to all of geologic time.
