---
"@macrostrat/data-sheet": patch
---

Graceful degradation on load errors. A failed `fetchData` (e.g. the whole PostgREST route returning 401) was caught but never surfaced — the panel sat blank. Now the load error flows through `tableFooterAtom` / `useLoadControls().error`; `LoadProgressIndicator` shows a compact error chip, and `DataPanel` shows a "Couldn't load data" `NonIdealState` (and a "No results" state for a genuinely empty result) instead of a perpetual spinner or an empty list.
