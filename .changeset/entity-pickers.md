---
"@macrostrat/data-components": minor
---

Pickers for controlled vocabularies, for editing at the point of entry rather
than in free text:

- `TagPicker`: the chosen items as the tags themselves — no chip, remove cross
  or inline inputs. Selecting a tag opens its details editor, in a popover or
  inline below the row (`detailsMode`); without an editor, a selected tag is
  followed by a ✕ (`removeButton` chooses). Delete removes a tag, the arrow keys
  move between tags; `removable: false` turns removal off. Read-only when
  `onChange` is absent. `VocabularyList` (the searchable list) is exported;
  chosen rows are bold, and a swatch is drawn only for an item with a colour.
- `TagDetailsEditor`: the editor a selected tag opens, built from sections
  (label, add action, summary, field, optional `onRemove`) — a menu of actions
  in a popover, every field inline — under a header naming the item in its tag's
  text colour (`header: false` omits it). What is chosen within it (attributes,
  a proportion's term) takes the item's colours through `--selected-color` and
  `--selected-background-color` (`useSelectionColors`; `selectionColor` on
  `TagPicker` and `VocabularyList` for lists in their own popover). Removal is a
  danger ✕ at the right of the header (the item) or of a section (its value),
  present only with an `onRemove`. `RemoveButton` is exported.
- `LithologyPicker`: selecting a lithology offers Add proportion and Add
  attributes, with its ✕ in the header; the proportion and attributes are drawn
  on its `LithologyTag`. `proportions` takes options: a percentage (`numeric`),
  terms from an abundance vocabulary (`terms`), or both, and whether it can be
  cleared (`clearable`). A term is shown on the tag in place of a percentage and
  returned as `prop_term` alongside `prop`. `resolveProportions` (`true`, or a
  resolver of your own) adds each lithology's share of the whole as `comp_prop`
  on every change. `AttributeEditor` is exported.
- `ProportionEditor`, `ProportionTerm`, `resolveLithologyProportions` (numbers
  as given, the rest shared by term weight, as the backend computes
  `comp_prop`), and two vocabularies: `macrostratProportionTerms` (`dom`/`sub`,
  weighted 5:1) and `ngsProportionTerms`.
- `LithologyTag` takes a `proportionLabel`, shown in place of the percentage.
- `buildTagStyle` (a tag's colour variables) is exported.
- Every picker takes a `size`.
- `EnvironmentPicker`.
- `IntervalTag` takes a `proportion` (drawn in its prefix as "base", "top" or a
  percent) and an `age` (in its details, in place of the range), and an
  `interactive` flag — the design of the unit details panels, now the library's.
  `IntervalProportion`, `formatIntervalProportion`, `AgeLabel` and `getAge` move
  here from `@macrostrat/column-views`.
- `IntervalPositionEditor`: an interval and optionally a position within it,
  drawn as an `IntervalTag` with the age at that position; selecting the tag
  opens the position control inline. Matching can be constrained to a timescale,
  imposed (`timescale`) or chosen (`timescaleChoice`). `ageAtProportion` is
  exported.
- Vocabularies default to the enclosing `MacrostratDataProvider`; a list passed
  as a prop overrides it for that picker (`useVocabulary`).
- Stories: Pickers.
- Several rows at once: `LithologyPicker` and `EnvironmentPicker` take one list
  per row (`values`, `onChangeValues`) and show what the rows hold between them;
  a tag only some hold is drawn faded (`TagPicker`'s `partial`) and its header
  offers "Apply to all" (`onApplyToAll`, `ApplyToAllButton`). Adding or removing
  a tag, or editing its details, changes each row's own list. `combineValues`,
  `applyUnionChange`, `addToAll` and `updateInEach` are exported.
- A container can pin tags and pickers through CSS variables:
  `--tag-line-height` and `--tag-outline` on a tag, `--tag-picker-height` (which
  centres the row in that height), `--tag-picker-overflow` and `--tag-row-wrap`
  on a picker.
