---
"@macrostrat/column-views": minor
---

Add `useTimescaleZoom`: click-to-zoom navigation over geologic time, extracted
from the Interval zoom story. Clicking a timescale interval animates the
rendered age window to it, clicking the interval you are in zooms back out a
level, and the timescale's level window slides with the selection so finer
intervals come into reach as you drill. `columnProps` spreads the window, the
levels, the click handler and the selected-interval styling onto a `Column`.
`unitsAgeExtent` derives the full extent from a set of units.
