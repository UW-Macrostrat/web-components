---
"@macrostrat/column-views": minor
---

Color age-model surfaces by the interval they are calibrated against: the
surface line and its label's leader line both take the interval's color, and
the lines are drawn a little heavier. The label's endpoint marker is gone —
the leader now runs into the surface line itself.

`SurfaceDetailsPanel` accepts a `null` surface and renders an empty state, so a
panel bound to a selection doesn't have to be guarded by its caller.
