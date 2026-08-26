---
"@macrostrat/data-sheet": minor
---

Starting a view somewhere other than the beginning — three additions that each
remove a wasted request:

- **`TableDataProvider.distinctValues(columnKey, options?)`** — the values a
  column actually holds, with frequencies where the source reports them. A value
  picker can then offer only choices that match something, instead of a
  free-text box (or a hand-rolled scan of the table). Implemented for both
  built-in providers: `createLocalProvider` counts in memory, and
  `createPostgRESTProvider` uses a grouped aggregate query
  (`select=col,count()`), so one small request returns the whole vocabulary.
  `baseFilter` applies to it; the _active_ filters deliberately don't — a picker
  whose options vanish as you narrow the view can't be used to widen it again.
  New `useDistinctValues(columnKey)` / `useDistinctValueList(columnKey)` hooks
  read it, cached per (provider, column, refresh token) so controls that mount
  and unmount with a menu don't each pay for a request, and a provider mutation
  refreshes the vocabulary. Also exported: `distinctValuesOf(rows, columnKey)`
  for in-memory sources.
- **`initialFilters` / `initialSorts`** on any data view — view state applied
  when the store is _created_, so a restored view (a link, a saved query, a
  server render) issues one correct fetch. Applying the same state from an
  effect, which was the only option before, always let the unfiltered first page
  go out and immediately superseded it: a wasted round-trip and a flash of the
  wrong rows on every linked view. Uncontrolled — later user changes win.
- **`initialData`** — rows already in hand for the first window, so a
  server-rendered page doesn't re-request what it just shipped. Accepts bare
  rows or `{ rows, totalCount }`; with a total, the sparse array is pre-sized,
  so the scrollbar and the counter are right from the first paint. The loader
  starts `initialized` (no empty-state flash, no mount fetch); scrolling past
  the seed loads normally, and any view change discards it — the seed only
  describes the view it was fetched for, so pair it with matching
  `initialFilters` / `initialSorts`.

Also: **`useLoadControls()` now exposes `page`, `pageSize`, and `totalPages`**
(the loader already computed them; the footer contract dropped them). A footer
can now render a real _link_ to the next page rather than only a button that
calls `loadMore` — which is what a crawler, or a client with no JavaScript, can
actually follow.

New story `Data sheet/Data panel/Initial state` demonstrates all three against a
provider that logs every request, so the saving is visible rather than asserted
— including the realistic combination (server resolves the view from the URL,
fetches that page, ships both) where the client mounts with no request at all.
