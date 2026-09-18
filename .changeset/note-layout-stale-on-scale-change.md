---
"@macrostrat/column-components": patch
---

Fix notes columns rendering a stale layout after the column zooms or its data
changes. `NoteLayoutProvider` re-filtered the notes and laid them out in the
same pass, so the layout used the note set it was replacing, and the pass that
followed skipped the work because its guard only counted nodes — two columns
with the same number of notes looked identical to it. Notes now lay out once
the new set is in state, and the guard identifies the set itself.
