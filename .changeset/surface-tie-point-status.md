---
"@macrostrat/column-views": minor
---

Infer `relative` status for age-model surfaces that cannot have been
interpolated: those sitting on the base or top of their calibration interval,
and the edges of gap-bound packages (the youngest surface in a section with no
unit above, or the oldest with none below). `boundary_status` records many of
these as `modeled`, so filtering to the tie-point statuses was hiding real tie
points. `inferTiePointStatuses` promotes them client-side and marks the result
`statusInferred`, which `SurfaceStatusTag` shows. On by default;
`inferTiePoints: false` on `ColumnSurfaces`, `useColumnSurfaces` or
`surfacesFromBoundaries` takes the data as recorded.

Fix surface lines drifting out of alignment with the units column: the overlay
measured its position once and only re-measured on its own resize, so a sibling
changing width — the timescale, once its intervals load — left it stale.
