---
"@macrostrat/data-sheet": patch
---

Stop `DataPanel`'s infinite-scroll sentinel from re-requesting a chunk that failed to load (e.g. a 401), which looped without pause
