---
"@macrostrat/data-sheet": patch
---

Smoother windowed loading (workstream H):

- **`filterDebounce`** (ms) on `DataSheet` / `DataPanel` — debounces the view-state → refetch, so typing in a text filter no longer resets and refetches on every keystroke. The input (and store) stay instant; only the fetch waits for the view to settle. Scroll paging is unaffected. Default `0` keeps immediate refetching.
- **`DataPanel` skeleton rows** — the panel used to *skip* the loader's `null` placeholder rows, so a view change flashed the list blank while the sheet showed skeletons. It now renders bounded shimmer cards where the loading page's rows will land (on a view change and on the next scroll page), so the body height stays stable — no blank flash, no footer pinging up into the scroll flow. The end region also holds a constant min-height.
- **No empty-state flash** — `useLoadControls()` now exposes `initialized`; the "No results" state shows only after a fetch settles empty, not during the reset→fetch gap.
