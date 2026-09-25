# Changelog

## [1.7.0] - 2026-09-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.6.0...@macrostrat/data-components-v1.7.0)

### Minor Changes

- Vocabulary pickers and an interval tag with position and age
  [dc1feb79](https://github.com/UW-Macrostrat/web-components/commit/dc1feb7961e6f901fe6a3dbb2d3f3bdba03cc32c)

  - `TagPicker` — chosen items as tags; select one to open its details editor
    (popover, inline, or stacked), Delete removes it
  - `TagDetailsEditor` — a tag's sections as a menu or inline fields, with
    danger ✕ removal
  - `LithologyPicker` — proportions (percent or abundance terms) and attributes
    per lithology; `resolveProportions` adds `comp_prop`
  - `EnvironmentPicker`, `IntervalPositionEditor` — environments; an interval
    with an optional position and derived age
  - `ProportionEditor`, `macrostratProportionTerms`, `ngsProportionTerms`,
    `resolveLithologyProportions`
  - Multi-row pickers (`values` / `onChangeValues`) with partial tags, "Apply to
    all", and `mergeItems` (`mergeLithologies`)
  - Vocabularies default to `MacrostratDataProvider` (`useVocabulary`); a prop
    overrides
  - `IntervalTag` — `proportion` in the prefix, `age` in the details,
    `interactive`; `IntervalProportion`, `AgeLabel`, `getAge` moved here from
    column-views
  - `LithologyTag` — `proportionLabel`; `buildTagStyle` exported
  - CSS variables for containers: `--tag-line-height`, `--tag-outline`,
    `--tag-picker-height`, `--tag-row-wrap` (one-line rows show "and n more")

### Patch Changes

- Updated dependencies
  [5be3d4c9](https://github.com/UW-Macrostrat/web-components/commit/5be3d4c9f3fcf4442720a7ed3bdb72abca4db4ab)
  - @macrostrat/data-provider@1.4.0

## [1.6.0] - 2026-09-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.5.1...@macrostrat/data-components-v1.6.0)

### Minor Changes

- Add `ExpansionPanelAccordion`, a container for a stack of `ExpansionPanel`s
  [d12c36e8](https://github.com/UW-Macrostrat/web-components/commit/d12c36e83869ead8da357602259055c54607a9d8)
  whose headers stay on screen: each pins to the top of the scrolling container
  once its section has scrolled past, and waits at the bottom until its section
  is reached. Opening a section scrolls it up to the top of the stack, so a
  header waiting at the bottom edge reveals its content rather than expanding
  below the fold.

## [1.5.1] - 2026-08-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.5.0...@macrostrat/data-components-v1.5.1)

### Patch Changes

- Don't be as rigid about identifiers
  [e2c2fd73](https://github.com/UW-Macrostrat/web-components/commit/e2c2fd731a24e3ae60d4bbab5f04dc56b9a7b3e8)

## [1.5.0] - 2026-08-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.4.1...@macrostrat/data-components-v1.5.0)

### Minor Changes

- Move Identifier and UnitIdentifier to `@macrostrat/data-components`
  [91fcea53](https://github.com/UW-Macrostrat/web-components/commit/91fcea536dd55e387b6f5bce1da0c07395da4635)

### Patch Changes

- Add new units to macrostratIdentifierFields resolution
  [1961f84a](https://github.com/UW-Macrostrat/web-components/commit/1961f84a397a341ce92eb032dcdc77c79f957707)
- Remove some unnecessarily bundled packages
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)

## [1.4.1] - 2026-07-30 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.4.0...@macrostrat/data-components-v1.4.1)

### Patch Changes

- - Improve column correlation chart to support more options
    [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
  - Create a new column reorganization draggable control
  - Update data provider for intervals fetching

## [1.4.0] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.3.0...@macrostrat/data-components-v1.4.0)

### Minor Changes

- Remove createStateIsolation and associated exports from
  `@macrostrat/data-components`; move them to `@macrostrat/scoped-store`.

### Patch Changes

- Updated dependencies
  - @macrostrat/scoped-store@1.0.1

## [1.3.0] - 2026-07-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.2.0...@macrostrat/data-components-v1.3.0)

### Minor Changes

- Create a `@macrostrat/scoped-store` library:
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
  - Move Jotai scope and enhancements to a separate package (formerly part of
    `@macrostrat/data-components`).
  - Add extensions for Zustand coordination (`ZustandStoreProvider`,
    `useZustandSelector`, `useZustandStoreAPI`).

### Patch Changes

- Updated dependencies
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
- Updated dependencies
  [3bb6b543](https://github.com/UW-Macrostrat/web-components/commit/3bb6b543e20db76e55fbe454116d871e096dfa3d)
- Updated dependencies
  [155a855c](https://github.com/UW-Macrostrat/web-components/commit/155a855c2bf99d6f218735616724ab6f5a362590)
  - @macrostrat/scoped-store@1.0.0
  - @macrostrat/mapbox-utils@1.8.0
  - @macrostrat/ui-components@5.1.0

## [1.2.0] - 2026-07-16 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.13...@macrostrat/data-components-v1.2.0)

### Minor Changes

- Add a TagEditor component
  [5860d7dd](https://github.com/UW-Macrostrat/web-components/commit/5860d7ddba47dabca75e11ee9e064fce1bfb6af5)

## [1.1.13] - 2026-07-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.12...@macrostrat/data-components-v1.1.13)

### Patch Changes

- Fix scoped store propagation error
  [3c1b00a5](https://github.com/UW-Macrostrat/web-components/commit/3c1b00a5d301eda83e1713154f36713e234e4001)

## [1.1.12] - 2026-05-24 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.11...@macrostrat/data-components-v1.1.12)

### Patch Changes

- Createa a basic ColumnRef interface

## [1.1.11] - 2026-05-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.10...@macrostrat/data-components-v1.1.11)

### Patch Changes

- Remove stray console log statements

## [1.1.10] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.9...@macrostrat/data-components-v1.1.10)

### Patch Changes

- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated `jotai` and `jotai-scope` dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)
  - @macrostrat/ui-components@5.0.10
  - @macrostrat/stratigraphy-utils@1.3.0

## [1.1.9] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.8...@macrostrat/data-components-v1.1.9)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updates to internal typings
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
- Updated dependencies
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
  - @macrostrat/ui-components@5.0.9
  - @macrostrat/color-utils@1.2.2
  - @macrostrat/mapbox-utils@1.7.4
  - @macrostrat/stratigraphy-utils@1.2.2

## [1.1.8] - 2026-05-11 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.7...@macrostrat/data-components-v1.1.8)

### Patch Changes

- Simplify handling of nested scoped stores

## [1.1.7] - 2026-05-07 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.6...@macrostrat/data-components-v1.1.7)

### Patch Changes

- Add enhancements `{use,useValue,useSet}` to scoped Jotai store
  [99baa5fb](https://github.com/UW-Macrostrat/web-components/commit/99baa5fb3b6fbe978eb2a9687e295218938b494e)
- Updated dependencies
  [64d04951](https://github.com/UW-Macrostrat/web-components/commit/64d04951e8b63f05f9325a0e13817164d1813df7)
  - @macrostrat/ui-components@5.0.8

## [1.1.6] - 2026-04-10 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.5...@macrostrat/data-components-v1.1.6)

### Patch Changes

- Improve layout of `IntervalField` ages
  [b5119a4b](https://github.com/UW-Macrostrat/web-components/commit/b5119a4b7775286461ae67dff9f04000068810d3)

## [1.1.5] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.4...@macrostrat/data-components-v1.1.5)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7

## [1.1.4] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-components-v1.1.3...@macrostrat/data-components-v1.1.4)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/ui-components@5.0.6

## [1.1.3] - 2026-02-13

Export a type

## [1.1.2] - 2026-02-09

- Improvements to `Tag` and `DataField` components, including better styles for
  lists of tags, and more consistent styling across viewport sizes and row
  wrapping.
- Moved `ExpansionPanel` and `ExpandableDetails` to this component from
  `@macrostrat/map-interface`
- Update `xDDExpansionPanel` to use `ExpansionPanel` and `ExpandableDetails`
  components, and improve styling of the expansion panel content.

## [1.1.1] - 2026-02-06

- Remove typings that repeat Vite defaults
- Improve tag components, specifically `IntervalTag`

## [1.1.0] - 2026-01-31

- Create a `MacrostratInteractionProvider` to standardize handling of navigation
  for clickable/linkable data items.
- Moved scoped data store utilities (based on `jotai-scope`) to this library.

## [1.0.1] - 2026-01-29

- Change layout of `package.json`

## [1.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Update bundling process to `@macrostrat/web-components-bundler`
- Make CSS imports optional; users must now import
  `@macrostrat/data-components/style.css` or
  `@macrostrat/data-components/dist/data-components.css` for styles

## [0.3.0] - 2026-01-20

- Replace `node-fetch` with `cross-fetch` in `PrevalentTaxa` component

## [0.2.2] - 2025-11-28

- Move location information (e.g., `LngLatCoords`, `Elevation`) React components
  into this module
- Add a `--unit-color` CSS variable

## [0.2.1] - 2025-08-22

- Improvements to Rockd checkin component
- Added `row` style option to `DataField`

## [0.2.0] - 2025-06-25

- onClick capability added to LithologyTag, IntervalTag, and EnvironmentList,
  returning event and associated data
- Added Rockd checkin listing components
- Improved Detrital Zircon spectra components

## [0.1.0] - 2025-04-09

- Added fields for data and tags, which can be used for rendering lists of
  complex lithology, interval, and other information from Macrostrat.
- Added helper components for comma-separated lists

## [0.0.6] - 2025-02-14

Add `node` target to bundle without imported CSS

## [0.0.5] - 2025-01-04

- Migrate from `vx` to `visx` for charts
- Update `@macrostrat/hyper` to version 3
- Remove unused dependencies
- Remove unused build scripts
- Add basic data fields
- Add field locations (Rockd and StraboSpot checkins)
