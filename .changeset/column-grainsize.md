---
"@macrostrat/column-views": minor
---

`Column` draws grain size: finer-grained units are narrower, from the right edge of the unit column — by up to 100 px, keeping at least 0.75 of the width (both tunable through `grainsizeOptions`). A unit's grain size comes from its dominant lithology — a grain-size attribute first, then a lithology with a known texture, then a default for its lithology type; igneous and metamorphic units stay full width. New `grainsize` prop (`"on" | "off" | "auto"`), defaulting to `auto`: on for measured columns and off for composites, per the new `columnType` prop (`columnTypeFromColType` maps a v2 `col_type`), or by axis where that is not given. `unitGrainsize` and `GrainsizeProvider` are exported.
