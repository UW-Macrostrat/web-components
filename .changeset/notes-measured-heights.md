---
"@macrostrat/column-components": patch
"@macrostrat/column-views": patch
---

Notes columns re-run their force layout once the notes' rendered heights have
been measured. The first layout ran on a 10px guess per note and was never
revisited, so notes taller than that (interval tags, two-line labels) overlapped
their neighbors. `ColumnNotes` also passes `forceOptions` through to the layout.
