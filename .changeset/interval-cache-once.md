---
"@macrostrat/data-provider": patch
---

`getIntervals` records a full fetch (`fetchedAll`), so later calls no longer refetch every interval and replace the store's map; concurrent requests for the same scope share one fetch
