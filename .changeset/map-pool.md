---
"@macrostrat/map-interface": minor
"@macrostrat/mapbox-react": patch
---

- `createMapPool` and `MapPoolProvider` let `MapView` reuse its `mapboxgl.Map` across mounts — e.g. client-side page navigations — instead of constructing a new map, which Mapbox bills as a map load. Opt in with the provider or a `pool` prop; `pool: null` opts a view out. Without a pool, nothing changes.
- `FeatureSelectionHandler` waits for the style to load before querying, and re-queries after a style change, instead of throwing mid-`setStyle`
- `useMapStyleOperator` runs a cleanup returned by its operator, so listeners added there (e.g. by `useMapClickHandler`) are removed rather than accumulating on each style load
