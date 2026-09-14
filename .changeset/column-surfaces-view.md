---
"@macrostrat/column-views": minor
"@macrostrat/api-types": minor
---

Add a surfaces view for a column's age model. `ColumnSurfaces`, dropped into a
`Column` as a child, draws the column's calibration surfaces from the
`/age_model` route as lines across the units (`ColumnSurfaceLines`) and as a
collision-avoiding notes column of labels beside them (`ColumnSurfaceLabels`),
styled by `boundary_status` and `boundary_type`, with hover and selection.
Labels use the standard `IntervalTag` for the calibration interval (with the
position within it) over the modeled age, are drawn by default only for the tie
points where the age model was constrained (absolute, relative, spike, imposed —
`labelStatuses` widens this), and take the label column over from the unit
labels while mounted (`useClaimLabelColumn`, a new way for a column's children
to claim that space). `SurfaceDetailsPanel` inspects a selected surface — model
age, calibration interval and position within it, the units it separates,
provenance — and `SurfaceStatusLegend` explains the line styles.

The view is data-agnostic: `useColumnAgeModel` fetches boundaries through the
`MacrostratDataProvider` base URL (the old overlay hardcoded the dev server),
`surfacesFromBoundaries` maps them to `ColumnSurface` records, and
`surfacesFromUnits` derives surfaces from unit tops and bottoms as the fallback
for columns without `unit_boundaries` (or for an editor's own state).
`BoundaryAgeModelOverlay` and `ComputedSurfacesOverlay` remain as deprecated
wrappers. `ColumnNotes` gains `onClickNote` and `className` passthroughs.

`@macrostrat/api-types` gains `AgeModelBoundary` and the `BoundaryStatus` /
`BoundaryType` vocabularies, mirroring the database enums.
