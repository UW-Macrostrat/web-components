---
"@macrostrat/data-sheet": patch
---

Fix two `DataSheet` regressions surfaced by the map-ingestion integration:

- `enableColumnReordering` now reaches the Blueprint `Table` (drag-reorder was
  never actually enabled).
- `rowHeaderRenderer` results are wrapped in a `RowHeaderCell` and a nullish
  return falls back to the default row label, per the documented contract
  (previously a nullish return dropped the row header entirely).
