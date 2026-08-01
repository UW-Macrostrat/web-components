---
"@macrostrat/column-views": minor
---

Add `useAnimatedAgeWindow`: animates a column/correlation-chart's rendered `t_age`/`b_age` for smooth pan-and-contract navigation at constant `pixelScale` (density), driving the existing clipping + zig-zag unit edges. Threads `isTransitioning` / `hideLabelsWhileTransitioning` flags through `Column`/`CorrelationChart` → `ColumnProvider`; labels stay visible through the animation by default, with an opt-in toggle to hide them. New stories for the correlation chart and a single stratigraphic column, each with a fixed-`pixelScale` variant and a label-hiding toggle.

Stabilize composite-scale package keys (positional index instead of `package-${b_age}-${t_age}`) so the correlation chart's packages, columns, and timescale reconcile instead of remounting on every animation frame. Unit labels re-fit when a transition settles (via `SizeAwareLabel`'s `remeasureKey`), not on intermediate frames.

`Column` now forwards `onClickTimescaleInterval` and `timescaleIntervalStyle` to its composite timescale (via `CompositeTimescale`'s new `onClickInterval`/`intervalStyle` props), so a standalone column supports click-to-zoom interval navigation and per-interval styling (e.g. bolding the selected interval).

Add a semantic-zoom story: narrowing the window raises `targetUnitHeight` by a smooth function of the zoom factor, so the existing content-aware layout draws things bigger as you zoom in (with `minPixelScale`/`minSectionHeight` still guarding small sections). Navigation is via timescale-interval click, and the timescale shows a fixed 3-level window that slides with the selected interval's rank (always one coarser level to navigate up, one finer to drill down) — independent of the layout.
