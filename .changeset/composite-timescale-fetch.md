---
"@macrostrat/column-views": minor
---

Draw several timescales beside a column. A new `timescales` prop takes them in
order, each a Macrostrat timescale ID or a timescale carrying its own
intervals, levels and label — the international timescale is one of these
rather than a special case. Clicks and per-interval styles report which
timescale they came from, so the same interval drawn in two of them can be
told apart, and `useTimescaleZoom` treats a click in another timescale as
moving the selection rather than zooming out. Timescales are fetched in one
place rather than once per section.
