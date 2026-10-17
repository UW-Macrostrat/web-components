---
"@macrostrat/map-interface": patch
---

Narrow-screen (<768px) map layout: square panel corners, a shrinking info drawer
whose body scrolls, and a map that fills the area behind the panels (padded
rather than resized), as on desktop. Mapbox's logo and attribution stay above
the drawer, with the scale and map buttons in a row over them. The drawer slides
in rather than growing.

The map waits for a `LocationPanel` to finish loading before moving to the
selected location, so it moves once with the drawer at its final size. Other
detail panels can report loading with `useReportDetailPanelLoading`.
