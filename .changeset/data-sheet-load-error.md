---
"@macrostrat/data-sheet": patch
---

Stop the data loader from re-requesting a chunk that failed to load, for `DataSheet` as well as `DataPanel`; a failed load is final until the view changes or is refreshed
