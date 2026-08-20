---
"@macrostrat/column-components": minor
---

Add `isTransitioning` to `ColumnContext`/`ColumnProvider` so consumers can skip expensive per-frame recalculation while a column's scale/age-window is animating. Add a companion `hideLabelsWhileTransitioning` flag (default false): unit labels now stay visible through the animation by default, with hiding available as a perf escape hatch.

Add `ClippableRect`: a presentational SVG box primitive (beside `zigZagBoxPath`) that always renders a `<path>` with optional zig-zag top/bottom edges. Because the element type no longer changes as clip state toggles, React stops remounting unit boxes during age-window animations — a large transition-performance win. Replaces the `<rect>`/`<path>`-switching `UnitRect` that previously lived in `@macrostrat/column-views`.
