---
"@macrostrat/data-components": minor
---

Standardized pickers for controlled vocabularies, for editing at the point of
entry rather than in free text:

- `ItemPicker`: chosen items as coloured tags (removable), with an add/change
  affordance opening a searchable list of the vocabulary. Single or multi;
  read-only when `onChange` is absent, so one component both shows and edits a
  value.
- `LithologyPicker` and `EnvironmentPicker`: `ItemPicker` over Macrostrat's
  lithology and environment definitions, drawing the chosen items as
  `LithologyTag`s and handing back the unit's own array shape
  (`UnitLithology[]`, `Environment[]`). The lithology picker edits each entry's
  proportion as a percent.
- `IntervalPositionEditor`: an interval and a proportion within it — the
  column-ingestion format's chronostratigraphic position — with the age it works
  out to shown as a derived value. `ageAtProportion` is exported.
- Story: Pickers.
