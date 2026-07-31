---
"@macrostrat/timescale": minor
---

Add `useZoomableScale` hook for animated, `d3`-transform-driven click-to-zoom timescale navigation.

Fix interval labels not re-fitting after a zoom: they now re-evaluate (abbreviate or restore the full name) when the box size settles at a new scale, instead of only at mount and only ever shrinking.
