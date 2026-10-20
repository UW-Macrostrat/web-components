---
"@macrostrat/column-views": minor
---

A plain click on the selected unit deselects it; it had reselected the same unit, so a selection could only be cleared from a details panel. New `deselectOnClick` prop on `Column`, `MacrostratColumnStateProvider` and `MacrostratColumnDataProvider` (default `true`) keeps the old behavior when `false`. With multiple selection, this applies when the unit is the whole selection; ⌘/Ctrl- and Shift-clicks are unchanged.
