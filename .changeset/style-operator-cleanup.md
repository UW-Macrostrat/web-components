---
"@macrostrat/mapbox-react": patch
---

`useMapStyleOperator` runs a cleanup returned by its operator, so listeners
added there (e.g. by `useMapClickHandler`) are removed rather than accumulating
on each style load.
