---
"@macrostrat/column-views": minor
---

Reduce the options that set how tall a column draws to the few that say
different things. They all resolve to one quantity — density, the pixels given
to one unit of the axis.

`targetUnitHeight` is the usual knob: room for a typical unit, now the
geometric mean of the visible units' extents rather than their arithmetic
mean, which a few long units skew far above anything on screen.
`minSectionHeight` and `minPixelScale` floor it for legibility.
`pixelScale` is the alternative: a density stated outright, which is then the
density — the floors no longer apply to it, since they would undo the scale
you stated, and `Column` no longer adjusts them behind the scenes. It is
quoted in whatever the axis measures, so `pixelsPerMyr` and `pixelsPerMeter`
spell it per axis, the way `t_age` and `t_pos` already do for the window:
both can be held at once and the axis picks, since useful values for the two
differ by orders of magnitude.
`sectionOptions` decides any of these per section, given what the section
holds.

`heightMultiplier` is gone — asking for more room per unit is the same
control, and leaves the legibility floors where they belong — as is the
internal `visibleWindow`, which only restated `t_age`/`b_age`.
