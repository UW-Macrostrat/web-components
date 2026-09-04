# Changelog

## [3.11.0] - 2026-09-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.10.0...@macrostrat/column-views-v3.11.0)

### Minor Changes

- Add `AgeWindowTag`, a compact, clearable indicator of the age window a column
  or
  [0dfa4399](https://github.com/UW-Macrostrat/web-components/commit/0dfa4399e47298a2cb37aafa5785149a5f5b994d)
  correlation chart is focused on — an interval tag with its range (or the
  refined range when the window is narrower than the interval), or a bare age
  range — for use in a chart's `axisTopContent` or page chrome.

  Add `intervalShortFromTimescale`, adapting the `Interval` delivered by a
  `Timescale` click (`eag`/`lag`/`nam`/`col`) to the `IntervalShort` shape the
  `@macrostrat/data-components` tags take.

  Add `timescaleIntervalStyle` to `CorrelationChart`, forwarding a per-interval
  style to its timescale so the selected interval can be highlighted, matching
  the existing `Column` prop.

## [3.10.0] - 2026-09-01 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.9.0...@macrostrat/column-views-v3.10.0)

### Minor Changes

- Improve the internal structure of the correlation map store
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Created the @macrostrat/map-views module for specific map interactions and
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
  high-level views around Macrostrat maps.

### Patch Changes

- Improve the rendering of correlation chart units
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Updated dependencies
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Updated dependencies
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)
- Updated dependencies
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
  - @macrostrat/map-views@1.0.0
  - @macrostrat/scoped-store@1.1.0
  - @macrostrat/stratigraphy-utils@1.4.0
  - @macrostrat/api-types@1.3.0

## [3.9.0] - 2026-08-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.8.0...@macrostrat/column-views-v3.9.0)

### Minor Changes

- Add `useAnimatedAgeWindow`: animates a column/correlation-chart's rendered
  `t_age`/`b_age` for smooth pan-and-contract navigation at constant
  `pixelScale` (density), driving the existing clipping + zig-zag unit edges. It
  runs on the shared `useAnimatedDomain` core from `@macrostrat/timescale`.
  Threads `isTransitioning` / `hideLabelsWhileTransitioning` flags through
  `Column`/`CorrelationChart` → `ColumnProvider`; labels stay visible through
  the animation by default, with an opt-in toggle to hide them. New stories for
  the correlation chart and a single stratigraphic column, each with a
  fixed-`pixelScale` variant and a label-hiding toggle.
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)

  Add `windowPadding` (px): how much of the sections abutting the rendered
  `t_age`/`b_age` window to reveal, so neighboring stratigraphy — and its
  timescale intervals — stay visible and navigable when zoomed in. Available on
  `Column` and `CorrelationChart`.

  Unit density is now derived from the units the rendered window actually shows,
  measured by their visible duration — so `targetUnitHeight` describes the units
  on screen at any zoom depth, rather than the containing section's overall
  average. A section the window doesn't reach falls back to its own units at
  full duration and is drawn at its own scale. This removes the need for any
  zoom-factor input: clipping shortens visible durations, which raises density,
  so a column renders identically whether a window was animated to or set
  directly.

  Age columns now lay every section out at its **full extent** and apply the
  rendered window as the last step, rather than clipping units and section
  bounds up front. A section abutting the window therefore keeps its own density
  and `minSectionHeight`, and is then trimmed to exactly the requested sliver —
  previously such a fragment had its density re-derived from the few units that
  survived the clip and was re-inflated to the floor, with its scale stretched
  to match. Sections clipped by the window itself still honor
  `minSectionHeight`, expanding their scale rather than rendering a sliver; only
  the padding margin past the window renders at exactly its requested pixels.
  Those final densities are resolved before the padding budget is spent, so a
  margin measures the pixels requested rather than those pixels times whatever
  stretch its neighbor needed — otherwise a short interval (a Holocene beside a
  Pleistocene) is swallowed by its own margin. This also makes `windowPadding`
  exact (it is spent against real section pixel heights; unconformity gaps
  aren't charged, so padding smaller than `unconformityHeight` can still reach
  across one) and stops unconformity-collapse decisions from shifting as the
  window moves. Hybrid and externally-supplied scales keep the previous
  clip-then-lay-out path.

  Stabilize composite-scale package keys (positional index instead of
  `package-${b_age}-${t_age}`) so the correlation chart's packages, columns, and
  timescale reconcile instead of remounting on every animation frame. Unit
  labels re-fit when a transition settles (via `SizeAwareLabel`'s
  `remeasureKey`), not on intermediate frames.

  `Column` now forwards `onClickTimescaleInterval` and `timescaleIntervalStyle`
  to its composite timescale (via `CompositeTimescale`'s new
  `onClickInterval`/`intervalStyle` props), so a standalone column supports
  click-to-zoom interval navigation and per-interval styling (e.g. bolding the
  selected interval).

  Add an interval-zoom story (grouped with the other animation stories under
  `Column views/Column animations`): clicking a timescale interval animates the
  window to it, a preceding/postdating interval moves along the timescale, and
  clicking the selected interval zooms out a level. The timescale shows a fixed
  3-level window that slides with the selected interval's rank (always one
  coarser level to navigate up, one finer to drill down), independent of the
  layout. `targetUnitHeight`, `minSectionHeight` and `windowPadding` are plain
  display controls — there is no zoom-level input.

### Patch Changes

- Fix two zoom-sync issues exposed by animated age-window zoom:
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)

  - Age-axis (`AgeAxis`) now redraws when the scale's domain/range changes (not
    just its object identity), and builds a fresh d3 axis generator each render.
    Reusing the generator retained stale `.tickValues()` config, so a section
    that was short (explicit first/last ticks) and later stretched kept those
    out-of-domain tick values — leaving some axes with no labels. Both surfaced
    once stable React keys stopped the axis remounting per frame.
  - The inline-label/note tracker (`LabelTrackerProvider`) re-syncs to the
    _current_ visible unit set on zoom. Its stale gate froze the "unlabeled" set
    once the unit set changed, so a unit whose label now fit inline also kept
    rendering as a note; it now recomputes over current units.

- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
  - @macrostrat/timescale@3.2.0
  - @macrostrat/column-components@2.1.0
  - @macrostrat/ui-components@5.2.0
  - @macrostrat/map-styles@2.2.7

## [3.8.0] - 2026-08-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.7.0...@macrostrat/column-views-v3.8.0)

### Minor Changes

- Move Identifier and UnitIdentifier to `@macrostrat/data-components`
  [91fcea53](https://github.com/UW-Macrostrat/web-components/commit/91fcea536dd55e387b6f5bce1da0c07395da4635)

### Patch Changes

- Remove some unnecessarily bundled packages
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)
- Updated dependencies
  [1961f84a](https://github.com/UW-Macrostrat/web-components/commit/1961f84a397a341ce92eb032dcdc77c79f957707)
- Updated dependencies
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)
- Updated dependencies
  [91fcea53](https://github.com/UW-Macrostrat/web-components/commit/91fcea536dd55e387b6f5bce1da0c07395da4635)
  - @macrostrat/data-components@1.5.0
  - @macrostrat/column-components@2.0.10
  - @macrostrat/mapbox-react@3.3.3

## [3.7.0] - 2026-07-30 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.6.1...@macrostrat/column-views-v3.7.0)

### Minor Changes

- - Improve column correlation chart to support more options
    [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
  - Create a new column reorganization draggable control
  - Update data provider for intervals fetching

### Patch Changes

- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
  - @macrostrat/map-interface@2.3.1
  - @macrostrat/mapbox-react@3.3.2
  - @macrostrat/data-components@1.4.1
  - @macrostrat/data-provider@1.2.0
  - @macrostrat/timescale@3.1.6

## [3.6.1] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.6.0...@macrostrat/column-views-v3.6.1)

### Patch Changes

- Fix regression in unit selection

## [3.6.0] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.5.1...@macrostrat/column-views-v3.6.0)

### Minor Changes

- Remove createStateIsolation and associated exports from
  `@macrostrat/data-components`; move them to `@macrostrat/scoped-store`.

### Patch Changes

- Updated dependencies
  - @macrostrat/data-components@1.4.0
  - @macrostrat/scoped-store@1.0.1

## [3.5.1] - 2026-05-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.5.0...@macrostrat/column-views-v3.5.1)

### Patch Changes

- Improve code for section merging
  [14bde559](https://github.com/UW-Macrostrat/web-components/commit/14bde559db68f21beb0e0a58d57db03bf6e68e69)
- Added a story for correlation diagram creation
  [67fba54a](https://github.com/UW-Macrostrat/web-components/commit/67fba54a699a925f1bf5595051c9831dc789a4db)
- Updated dependencies
  [89bb4be0](https://github.com/UW-Macrostrat/web-components/commit/89bb4be0d6ae6a73ac22d47cb3d9f12964a05e36)
  - @macrostrat/timescale@3.1.5

## [3.5.0] - 2026-05-24 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.2...@macrostrat/column-views-v3.5.0)

### Minor Changes

- Createa a basic ColumnRef interface

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @macrostrat/data-components@1.1.12
  - @macrostrat/data-provider@1.1.0

## [3.4.2] - 2026-05-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.1...@macrostrat/column-views-v3.4.2)

### Patch Changes

- Fix interval provision for timescales
- Updated dependencies
  - @macrostrat/data-provider@1.0.5
  - @macrostrat/timescale@3.1.4

## [3.4.1] - 2026-05-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.0...@macrostrat/column-views-v3.4.1)

### Patch Changes

- Remove stray console log statements
- Updated dependencies
  - @macrostrat/data-components@1.1.11

## [3.4.0] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.5...@macrostrat/column-views-v3.4.0)

### Minor Changes

- Update layout for column units overlaps
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)

### Patch Changes

- Fixed error with strat name viewer
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Improved types for API outputs
  [225ed9a4](https://github.com/UW-Macrostrat/web-components/commit/225ed9a4534b2d1f8be8af6ab7e4035352825614)
- Updated `jotai` and `jotai-scope` dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [225ed9a4](https://github.com/UW-Macrostrat/web-components/commit/225ed9a4534b2d1f8be8af6ab7e4035352825614)
- Updated dependencies
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)
- Updated dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
  - @macrostrat/data-provider@1.0.4
  - @macrostrat/column-components@2.0.8
  - @macrostrat/data-components@1.1.10
  - @macrostrat/map-interface@2.2.6
  - @macrostrat/ui-components@5.0.10
  - @macrostrat/mapbox-react@3.2.2
  - @macrostrat/api-types@1.2.0
  - @macrostrat/stratigraphy-utils@1.3.0
  - @macrostrat/map-styles@2.2.3

## [3.3.5] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.4...@macrostrat/column-views-v3.3.5)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updates to internal typings
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
- Updated dependencies
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
  - @macrostrat/column-components@2.0.7
  - @macrostrat/data-components@1.1.9
  - @macrostrat/data-provider@1.0.3
  - @macrostrat/map-interface@2.2.5
  - @macrostrat/ui-components@5.0.9
  - @macrostrat/api-types@1.1.6
  - @macrostrat/color-utils@1.2.2
  - @macrostrat/map-styles@2.2.2
  - @macrostrat/mapbox-react@3.2.1
  - @macrostrat/mapbox-utils@1.7.4
  - @macrostrat/stratigraphy-utils@1.2.2
  - @macrostrat/svg-map-components@2.0.3
  - @macrostrat/timescale@3.1.3

## [3.3.4] - 2026-05-11 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.3...@macrostrat/column-views-v3.3.4)

### Patch Changes

- Simplify handling of nested scoped stores
- Updated dependencies
  - @macrostrat/data-components@1.1.8

## [3.3.3] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.2...@macrostrat/column-views-v3.3.3)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/svg-map-components@2.0.2
  - @macrostrat/column-components@2.0.6
  - @macrostrat/data-components@1.1.5
  - @macrostrat/data-provider@1.0.2
  - @macrostrat/map-interface@2.2.3
  - @macrostrat/ui-components@5.0.7
  - @macrostrat/mapbox-react@3.1.3
  - @macrostrat/timescale@3.1.2
  - @macrostrat/map-styles@2.1.2

## [3.3.2] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.1...@macrostrat/column-views-v3.3.2)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/column-components@2.0.5
  - @macrostrat/data-components@1.1.4
  - @macrostrat/map-interface@2.2.2
  - @macrostrat/ui-components@5.0.6
  - @macrostrat/mapbox-react@3.1.2
  - @macrostrat/map-styles@2.1.1

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-03-31

- Remove a stray `console.log`
- Improve GBDB integration stories

## [3.3.0] - 2026-02-13

- Greatly streamline handling of `InsetMap`, column and unit overlay layers
- Improve design of age range tags

## [3.2.2] - 2026-02-09

- Move `AgeField` and `AgeRange` to separate exports
- Improve handling of interval ranges

## [3.2.1] - 2026-02-08

- Export `ThicknessField` for unit details panels

## [3.2.0] - 2026-02-06

- Update Mapbox dependency to v3
- Add a `MacrostratUnitsOverlay` component for rendering units on
  Mapbox/Maplibre maps, with optional patterns.

## [3.1.0] - 2026-01-31

- Moved `MacrostratDataProvider` and data fetchers to
  `@macrostrat/data-provider` for better modularity.
- Standardize approach to clickable/linkable data items in `UnitDetailsPanel`,
  using a new `MacrostratInteractionProvider` from
  `@macrostrat/data-components`.

## [3.0.3] - 2026-01-29

- Change layout of `package.json`

## [3.0.2] - 2026-01-28

Add rollup interop to fix CommonJS dependency linking issues

## [3.0.1] - 2026-01-28

- Fix CommonJS dependency linking issues

## [3.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Update bundling process to `@macrostrat/web-components-bundler`

## [2.4.4] - 2026-01-25

Add link to SGP facet

## [2.4.3] - 2026-01-06

- Fix error with unit notes for height-based columns

## [2.4.2] - 2025-12-19

Update minimum versions of dependencies

## [2.4.1] - 2025-12-18

- Improve unit selection
- Improve unit popover
- Better unit navigation for correlation diagram
- Show column name in unit popover

## [2.4.0] - 2025-12-15

- Remove `UnitSelectionProvider` in favor of `jotai` state management
- Refactor selected unit state management to use `jotai` atoms
- Improve performance of unit selection and rendering
- Update dependencies

## [2.3.3] - 2025-12-14

Upgraded `jotai` and `jotai-scope` dependencies

## [2.3.2] - 2025-12-13

Remove duplicate exports; fix typings

## [2.3.1] - 2025-12-10

Fix detrital zircon facet rendering bug

## [2.3.0] - 2025-12-10

- Streamline column facet components
- Create a mode for facets that allows focusing a single column-associated
  measurement
- Improve scale calculations in some edge cases
- Condense notes that are close together
- Add explicitly defined height where available from PBDB (eODP columns, mostly)
- Fixed axis label spacing
- Small bug fixes for unit selection

## [2.2.2] - 2025-12-04

- Fix a bug with unit deselection
- Fix missed updates in state management code
- Add a 'minimal' option to `unconformityLabels`
- Reduce precision of gap age labels
- Improvements to stories

## [2.2.1] - 2025-11-29

- Start unifying state management components
- Create a hoistable store for column state
- Begin using `jotai` for some aspects of state management

## [2.2.0] - 2025-11-28

- Update SGP and PBDB facets
- Improve `UnitDetailsPanel` styling and information content
- Improve use of discontinous scales
- Create `hybridScale` options block to allow more dynamic scale generation

## [2.1.4] - 2025-10-29

- Improve stories
- Add SGP facet

## [2.1.3] - 2025-08-22

- Added `UnitDetailsPanelWithNavigation` component
- Added `ColumnBasicInfo` component
- Improve styling of `UnitDetailsPanel`
- Add `ReferencesField` component for bibliographic info
- Add data fetchers for stratigraphic names

## [2.1.2] - 2025-06-26

- UnitDetailsPanel strat name and interval now clickable

## [2.1.1] - 2025-06-26

- Remove local reference

## [2.1.0] - 2025-06-25

- `UnitDetailsContent` allows setting item click or href for Environments,
  Lithologies, and Intervals.
- Add mouseover handlers to allow age cursor to be reported
- Add an `AgeCursor` component
- Reactivate carbon isotopes, detrital zircon, and PBDB integrations
- Make unit selection entirely optional
- Improve styling across the board
- Fix rendering bugs for sections with overlapping units

## [2.0.1] - 2025-05-08

Solve a problem with strict mode

## [2.0.0] - 2025-04-09

Major update for columns and correlation diagrams:

- Add Mapbox-based column selection and correlation-line selection maps
- Add `ColoredUnitComponent` based on mixing unit colors by lithology
- Fully integrated management of composite column scales, allowing for much more
  flexible column creation
- Added zigzag cutoffs when units overflow the time bounds of the column
- Added a unified `MacrostratDataProvider` that allows frontend caching of data
  dictionaries in the UI
- Major improvements to columns and styling

This release will support rendering of stratigraphic columns in Rockd and
Macrostrat.

## [1.0.3] - 2025-03-08

Export `UnitDetailsPanel`

## [1.0.2] - 2025-02-16

Improve column styles

## [1.0.1] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [1.0.0] - 2025-02-14

- First full release of the `@macrostrat/column-views` library
- Centralize column rendering components
- Create storybook examples
- Improve Typescript coverage
- Start process of simplifying React components
- Switch to `zustand` for some state management
