---
"@macrostrat/column-components": patch
"@macrostrat/column-views": patch
---

Fix two zoom-sync issues exposed by animated age-window zoom:

- Age-axis (`AgeAxis`) now redraws when the scale's domain/range changes (not just its object identity), and builds a fresh d3 axis generator each render. Reusing the generator retained stale `.tickValues()` config, so a section that was short (explicit first/last ticks) and later stretched kept those out-of-domain tick values — leaving some axes with no labels. Both surfaced once stable React keys stopped the axis remounting per frame.
- The inline-label/note tracker (`LabelTrackerProvider`) re-syncs to the *current* visible unit set on zoom. Its stale gate froze the "unlabeled" set once the unit set changed, so a unit whose label now fit inline also kept rendering as a note; it now recomputes over current units.
