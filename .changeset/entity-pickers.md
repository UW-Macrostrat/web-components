---
"@macrostrat/data-components": minor
---

Vocabulary pickers and an interval tag with position and age

- `TagPicker` — chosen items as tags; select one to open its details editor (popover, inline, or stacked), Delete removes it
- `TagDetailsEditor` — a tag's sections as a menu or inline fields, with danger ✕ removal
- `LithologyPicker` — proportions (percent or abundance terms) and attributes per lithology; `resolveProportions` adds `comp_prop`
- `EnvironmentPicker`, `IntervalPositionEditor` — environments; an interval with an optional position and derived age
- `ProportionEditor`, `macrostratProportionTerms`, `ngsProportionTerms`, `resolveLithologyProportions`
- Multi-row pickers (`values` / `onChangeValues`) with partial tags, "Apply to all", and `mergeItems` (`mergeLithologies`)
- Vocabularies default to `MacrostratDataProvider` (`useVocabulary`); a prop overrides
- `IntervalTag` — `proportion` in the prefix, `age` in the details, `interactive`; `IntervalProportion`, `AgeLabel`, `getAge` moved here from column-views
- `LithologyTag` — `proportionLabel`; `buildTagStyle` exported
- CSS variables for containers: `--tag-line-height`, `--tag-outline`, `--tag-picker-height`, `--tag-row-wrap` (one-line rows show "and n more")
