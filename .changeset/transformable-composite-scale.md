---
"@macrostrat/column-views": minor
---

Animated age-scale zoom for the correlation chart: `createTransformableCompositeScale` + `transformCompositeScaleInfo` (pixel-space, identity == today's layout), a controlled `transform` prop on `CorrelationChart`, and a `useAgeScaleZoom` driver (pan-model A: density + scroll). Exports `buildCorrelationChartData` / `defaultCorrelationChartScaleProps`.
