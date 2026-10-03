---
"@macrostrat/map-interface": patch
---

`FeatureSelectionHandler` waits for the style to load before querying, and
re-queries after a style change, instead of throwing mid-`setStyle`.
