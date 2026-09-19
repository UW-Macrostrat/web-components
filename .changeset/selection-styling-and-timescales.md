---
"@macrostrat/column-views": minor
---

One selection color across a column: `--column-selection-color` (the accent
color, purple) drives both the unit selection overlay — now a box with an
outline and a light wash, rather than a heavy red fill — and the surface
selection.

Surface lines are drawn at a constant weight; status shows in the dash pattern
and color. A selected surface is outlined as a box, keeping its interval color
inside, and a selected label bolds its interval tag rather than sitting in a
card.

`useTimescaleZoom`: shift-clicking a timescale interval widens the window to
take it in, instead of moving the window to it. `selectedIntervals` reports
everything in the selection; all of them are styled as selected.

`CompositeTimescale` takes a `timescaleID` (which timescale the leveled column
draws) and `additionalTimescales` (further timescales drawn as extra level
columns beside it, against the same section scales), and is exported.  `Column`
passes `additionalTimescales` through: narrow `timescaleLevels` by as many to
swap the finest international level for a regional one rather than widen the
timescale.

`heightMultiplier` on `Column` multiplies the heights the layout works out by a
fixed factor. The scaling approach is unchanged — density still comes from
`targetUnitHeight` and the section floors — so sections keep their proportions
and only the size changes; unconformity gaps and `windowPadding`, being chrome
rather than scale, stay put.
