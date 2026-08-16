---
"@macrostrat/timescale": minor
---

Add `useAnimatedDomain`: the shared, representation-free animation core for age-scale navigation (eased rAF traversal of a visible `[older, younger]` span within an extent, with a `prepareTarget` seam for consumer-specific padding/snapping). `@macrostrat/column-views`' `useAnimatedAgeWindow` runs on it too.

Add `useZoomableScale` hook for animated, `d3`-transform-driven click-to-zoom timescale navigation, with a pixel-space `padding` option (and `padDomain` helper) that collapses at the ends of the age extent.

Fix interval labels not re-fitting after a zoom: they now re-evaluate (abbreviate or restore the full name) when the box size settles at a new scale, instead of only at mount and only ever shrinking.

Fix interval clicks being reported twice: the same handler is bound to each interval box and to the container (which catches clicks that hit no interval), so a box click also bubbled up and fired a second time with no interval. Box clicks now stop propagating, leaving the container path for genuine misses.

Export the `IntervalStyleBuilder` type so consumers can pass a per-interval `intervalStyle` (e.g. to highlight a selected interval).
