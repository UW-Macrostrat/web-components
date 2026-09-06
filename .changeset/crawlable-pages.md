---
"@macrostrat/data-sheet": minor
---

- Keyset cursor in the provider contract: `FetchDataParams.after`; `createLocalProvider` slices past it (`rowsAfter` exported)
- `startAfter` starts a view after a row (seeded into the store, passed to the provider on every chunk, dropped on the first view change)
- `pageLinks` renders a visually hidden `rel="next"` link after the loaded rows and a "Return to top" notice for a mid-list start, so a list is crawlable from its server-rendered HTML
- Story: Data panel / Crawlable pages
