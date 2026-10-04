---
"@macrostrat/timescale": minor
---

The age axis supports piecewise scales, labelling their breakpoints, and no
longer mutates the scale it is given. A `scale` now maps age to pixels from the
top (vertical) or left (horizontal) edge, where the boxes are drawn; vertical
cursors and click ages are no longer mirrored when the axis is hidden. Callers
that passed a vertical scale with older ages at the top should flip its range.
