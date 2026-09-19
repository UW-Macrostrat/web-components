---
"@macrostrat/column-components": minor
---

A note can carry a `color`, which sets `--note-color` on its group — so its
connector and endpoint follow the thing the note describes rather than the
column's default note color.

Two options on the connector itself: `connectorOverhang` continues the leader
line a few pixels past each end, so it meets what marks the note's height in
the column on one side and the note body on the other instead of stopping in
the gap; `showPointMarker: false` drops the endpoint dot, which a connector
running into something already drawn at that height doesn't need.
