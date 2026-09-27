---
"@macrostrat/column-views": minor
---

- `Column` takes `showAgeAxis` (default `true`), to leave out the axis for a column whose coordinates aren't a measure
- An explicit `showTimescale: false` wins over `timescaleLevels` / `timescales`, which used to turn the timescale back on
- The unit details panel skips references `/defs/refs` doesn't know instead of throwing
