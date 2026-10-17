---
"@macrostrat/map-interface": patch
---

Narrow-screen (<768px) map layout: square panel corners, a shrinking info drawer
whose body scrolls, and a map that fills the area behind the panels (padded
rather than resized), as on desktop. Mapbox's logo and attribution stay above
the drawer, with the scale and map buttons in a row over them. The drawer slides
in rather than growing.

A loading `LocationPanel` holds map easing, so the map moves once the drawer has
its final size. `MapView` takes `centerInfoMarker` (default `NEAR_CENTER`): a new
info marker is centered only when it is at least that far out of focus.
