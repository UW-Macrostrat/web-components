---
"@macrostrat/mapbox-utils": minor
---

`getFocusState` judges focus relative to the size of the padded map area rather
than by fixed pixel buffers, uses CSS rather than device pixels, and takes an
optional `padding` to judge against. Positions more than 90° from the center are
now `OUT_OF_VIEW`.
