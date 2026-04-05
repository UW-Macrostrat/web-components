# Changelog

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
