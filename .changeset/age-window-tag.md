---
"@macrostrat/column-views": minor
---

Add `AgeWindowTag`, a compact, clearable indicator of the age window a column or
correlation chart is focused on — an interval tag with its range (or the refined
range when the window is narrower than the interval), or a bare age range — for
use in a chart's `axisTopContent` or page chrome.

Add `intervalShortFromTimescale`, adapting the `Interval` delivered by a
`Timescale` click (`eag`/`lag`/`nam`/`col`) to the `IntervalShort` shape the
`@macrostrat/data-components` tags take.

Add `timescaleIntervalStyle` to `CorrelationChart`, forwarding a per-interval
style to its timescale so the selected interval can be highlighted, matching the
existing `Column` prop.
