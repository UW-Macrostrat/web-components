---
"@macrostrat/timescale": minor
---

Add `SharedScaleTimescales`: several timescales side by side against one age
scale, with `useMacrostratTimescales` to fetch their intervals together. The
`Timescale` component moves to its own module so components can build on it
without cycling through the barrel.
