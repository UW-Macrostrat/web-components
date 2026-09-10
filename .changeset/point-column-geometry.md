---
"@macrostrat/data-provider": patch
---

Don't mangle point column geometries in `convertSmallAreasToPoints`. Point-located
columns (`col_type = 'section'`) have zero area, so they passed the zero-area test
and were rewritten as `{ type: "Point", coordinates: undefined }`, crashing any
consumer that streams the geometry.
