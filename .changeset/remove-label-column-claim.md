---
"@macrostrat/column-views": minor
---

Remove the label-column claim (`useClaimLabelColumn`, `useLabelColumnClaimed`
and the layout-overrides context behind them). `ColumnSurfaceLabels` no longer
hides the unit labels on its own: pass `showLabelColumn: false` to the `Column`
while surface labels are shown, as the facet columns already do.

Remove height easing functions for sections with few units.
