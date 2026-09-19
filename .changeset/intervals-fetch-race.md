---
"@macrostrat/data-provider": patch
---

Fix three bugs in cached interval fetching: a request for one timescale no
longer strips intervals out of the timescales fetched before it, a duplicate
request in flight shares the first one's response rather than resolving to
nothing, and fetched intervals merge into current store state rather than a
pre-fetch snapshot
