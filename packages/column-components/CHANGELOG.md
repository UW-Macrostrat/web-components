# Changelog

## [2.1.0] - 2026-08-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.10...@macrostrat/column-components-v2.1.0)

### Minor Changes

- Add `isTransitioning` to `ColumnContext`/`ColumnProvider` so consumers can
  skip expensive per-frame recalculation while a column's scale/age-window is
  animating. Add a companion `hideLabelsWhileTransitioning` flag (default
  false): unit labels now stay visible through the animation by default, with
  hiding available as a perf escape hatch.
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)

  Add `ClippableRect`: a presentational SVG box primitive (beside
  `zigZagBoxPath`) that always renders a `<path>` with optional zig-zag
  top/bottom edges. Because the element type no longer changes as clip state
  toggles, React stops remounting unit boxes during age-window animations — a
  large transition-performance win. Replaces the `<rect>`/`<path>`-switching
  `UnitRect` that previously lived in `@macrostrat/column-views`.

### Patch Changes

- Fix the notes column not re-laying-out on scale change: `NoteLayoutProvider`
  now re-filters notes to the visible domain and recomputes the vertical
  de-overlap when the column's scale/zoom changes, instead of only when the
  notes prop changes. Previously a zoom left notes at their prior positions,
  overlapping when zoomed out.
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
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
  - @macrostrat/timescale@3.2.0
  - @macrostrat/ui-components@5.2.0

## [2.0.10] - 2026-08-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.9...@macrostrat/column-components-v2.0.10)

### Patch Changes

- Remove some unnecessarily bundled packages
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)

## [2.0.9] - 2026-07-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.8...@macrostrat/column-components-v2.0.9)

### Patch Changes

- Fix issue with ColumnScroller
  [b2a10c61](https://github.com/UW-Macrostrat/web-components/commit/b2a10c616ba533a63b25fa16a6ba5c0174aa01a8)
- Updated dependencies
  [155a855c](https://github.com/UW-Macrostrat/web-components/commit/155a855c2bf99d6f218735616724ab6f5a362590)
  - @macrostrat/ui-components@5.1.0

## [2.0.8] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.7...@macrostrat/column-components-v2.0.8)

### Patch Changes

- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)
  - @macrostrat/ui-components@5.0.10
  - @macrostrat/stratigraphy-utils@1.3.0

## [2.0.7] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.6...@macrostrat/column-components-v2.0.7)

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
  - @macrostrat/stratigraphy-utils@1.2.2
  - @macrostrat/timescale@3.1.3

## [2.0.6] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.5...@macrostrat/column-components-v2.0.6)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7
  - @macrostrat/timescale@3.1.2

## [2.0.5] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-components-v2.0.4...@macrostrat/column-components-v2.0.5)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/ui-components@5.0.6

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2026-01-29

- Change layout of `package.json`
- Remove `ui-box` dependency in favor of `@macrostrat/ui-components`
- Remove color picker
- Bundle `labella` dependency to avoid CommonJS issues

## [2.0.3] - 2026-01-28

Update handling of `@uiw/react-color` dependency

## [2.0.2] - 2026-01-28

Add rollup interop to fix CommonJS dependency linking issues

## [2.0.1] - 2026-01-28

- Improve linking of CommonJS dependencies

## [2.0.0] - 2026-01-26

- Standardize bundling
- Require separate import of `@macrostrat/column-components/style.css` or
  ` @macrostrat/column-components/dist/column-components.css` for styles
- Update peer dependencies to React 19

## [1.5.1] - 2026-01-17

- Modernized color picker component
- Remove last `findDOMNode` usage for React 19 compatibility

## [1.5.0] - 2026-01-17

Remove outdated `react-images` dependency and convert `PhotoViewer` component to
a shim.

## [1.4.2] - 2025-12-19

Small fixes to typings

## [1.4.1] - 2025-12-13

Small fixes to note components

## [1.4.0] - 2025-12-10

- Major update to `Note` and note-related components
- Add a `FocusableNoteColumn` mode based on the `EditableNoteColumn` component
- Removed outdated note-related styles and simplified CSS scopes

## [1.3.1] - 2025-11-28

- Update axis components
- Improve handling on nonlinear and discontinuous axes

## [1.3.0] - 2025-10-29

- Switch to `@visx/axis` for axis rendering
- Remove `SymbolColumn` component
- Simplify many components
- Improve surface generation

## [1.2.0] - 2025-06-25

Major improvement and modernization for `Note` component for section-aligned
content.

## [1.1.0] - 2025-04-09

- Improve configurability of `AgeAxis` component
- Add an `ORDINAL` option to the `ColumnAxisType` enum
- Standardize generation of UUIDs to help with server rendering
- Improve `ClippingFrame` component to allow clipping to be turned off, and to
  allow different clipping shapes
- Improve Typescript types
- Switch many components from class-based to functional
- Remove some instances of `findDOMNode`

## [1.0.3] - 2025-02-16

Improve age axis styles

## [1.0.2] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [1.0.1] - 2025-02-14

- Update d3 dependencies to
  [v6](https://observablehq.com/@d3/d3v6-migration-guide)
- Remove `prop-types` dependency

## [1.0.0] - 2025-02-14

- First full release of the `@macrostrat/column-components` library
- Improve Typescript coverage
- Add storybook examples
- Modernize some React components

## [1.0.0-dev2] - 2024-10-02

- Fix package specifiers

## [1.0.0-dev1] - 2024-10-02

Initial testing release of the `@macrostrat/column-components` library for NPM

- Integrates some changes from the Naukluft app
- Move some primitives from the Naukluft app to the `@macrostrat/ui-components`
  library
