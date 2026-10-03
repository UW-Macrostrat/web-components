---
"@macrostrat/map-interface": minor
---

`createMapPool` and `MapPoolProvider` let `MapView` reuse its `mapboxgl.Map`
across mounts — e.g. client-side page navigations — instead of constructing a
new map, which Mapbox bills as a map load. Opt in with the provider or a `pool`
prop; `pool: null` opts a view out. Without a pool, nothing changes.
