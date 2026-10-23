---
"@macrostrat/mapbox-react": patch
---

`useMapEaseTo` waits for the pointer to lift before moving the map, so a camera move mid-drag no longer ends the drag as a click
