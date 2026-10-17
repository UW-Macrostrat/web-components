---
"@macrostrat/mapbox-react": minor
---

`useHoldMapEasing(held)` defers moving the map, e.g. while a panel loads; easing
requests made meanwhile are merged and settled on release. `useMapEaseTo` takes
`centerMarkerFrom`, a `PositionFocusState`: the map moves to a new `center` only
when it is at least that far out of focus under the incoming padding, and
otherwise takes the new padding without moving.
