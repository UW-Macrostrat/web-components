# Changelog

## [4.0.1] - 2026-07-09

Fixed small bug with the `editCells` api emitting `onEdit` events, which
supports controlled editing.

## [4.0.0] - 2026-07-09

Version 4 core evolution.

### Unified `TableDataProvider`

- Table recieves data provider (`provider` prop), with unified loader (`data` or
  `fetchData`) and `identity` key for rows identity (inferred if not provided)
- Load-progress indicator for progressively loading tables
- Built-in support for offset or keyset pagination (Note: mixed arbitrary
  loading is not yet supported)
- `scroll` or `paged` fetch modes

### Table controls and selection actions

Unified table-scoped controls and contextual (selection-driven) controls.

- `TableAction`s are driven by selection cardinality and shape (e.g.,
  single/multi column, single/multi row, single cell)
- Filter tags, with a `TableFilter` component and optional rendering of filter
  state via `TableFilter.describeState(state)`
- Different actions appear dependiing on the selection shape
- Actions appear in toolbars and, if appropriate, column header dropdowns
- Built-in Save / Reset actions.
- Actions with a `hotkey` (copy/cut/paste) are omitted from the toolbar.
- Cell validation via `columnSpec[].validate(value, row, ctx)`. Orthogonal to
  edit status so a cell can be edited _and_ invalid
- Toolbar strip above the table, and status bar below

### Editing and validation

- Opt-in controlled editing via `onEdit` hook and `rowStatus`/`updatedData`
  props.
- Automatic focus management when paging through a table (in
  `cellInteraction: "auto"` mode): Click or enter into a cell to focus, and
  focus is maintained on arrow navigation both within and between rows, until
  `Esc` dismisses.
- Improved cell-render context: Per-cell renderers now receive a
  `CellRenderContext`. `valueRenderer` takes an optional second argument
  `{ value, rowIndex, colIndex, column, row, isEdited, isDeleted }`, and a
  custom `cellComponent` receives the same object as a `cellContext` prop.s
- `columnSpec[].cellDetail(ctx)` renders a cell's surface as an editor when
  `ctx.editable` and a read-only viewe otherwise, superseding `dataEditor` /
  `detailRenderer` / `editorForCell` (still supported, now deprecated).
- Cell viewer/editor presentation via
  `detailPresentation: "popover" | "modal" | "inline"`. Starting point for
  editors with a variety of presentations (e.g., inline/omnibar), leading into a
  future row viewer/editor.
- General bugfixes for editing interactions and state management, especially in
  the presence of sorts and filters

## [4.0.0-dev3] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.0.0-dev2...@macrostrat/data-sheet-v4.0.0)

### Patch Changes

- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated `jotai` and `jotai-scope` dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
  - @macrostrat/data-components@1.1.10
  - @macrostrat/ui-components@5.0.10

## [4.0.0-dev2] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.0.0-dev1...@macrostrat/data-sheet-v4.0.0)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
  - @macrostrat/data-components@1.1.9
  - @macrostrat/ui-components@5.0.9
  - @macrostrat/color-utils@1.2.2

## [4.0.0-dev1] - 2026-05-06

Major update to internals of data sheet, including a new `jotai`-based state
model. Also, added cell-based tools for editing and data updates.

## [3.1.0] - 2026-04-10 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v3.0.4...@macrostrat/data-sheet-v3.1.0)

### Minor Changes

- New state model using Jotai scoped atoms to manage data sheet state
  [b5119a4b](https://github.com/UW-Macrostrat/web-components/commit/b5119a4b7775286461ae67dff9f04000068810d3)
  Removed `zustand-computed` dependency Improved lazy-loading examples

### Patch Changes

- Updated dependencies
  [b5119a4b](https://github.com/UW-Macrostrat/web-components/commit/b5119a4b7775286461ae67dff9f04000068810d3)
  - @macrostrat/data-components@1.1.6

## [3.0.4] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v3.0.3...@macrostrat/data-sheet-v3.0.4)

### Patch Changes

- General performance improvements for rendering and infinite scrolling
- Use `PopoverNext` instead of popover
  [4bd24d9f](https://github.com/UW-Macrostrat/web-components/commit/4bd24d9f65dacfdbbede3613921182858ec1e3d1)
- Re-enable column reordering
- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/data-components@1.1.5
  - @macrostrat/ui-components@5.0.7

## [3.0.3] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v3.0.2...@macrostrat/data-sheet-v3.0.3)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/data-components@1.1.4
  - @macrostrat/ui-components@5.0.6

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.2] - 2026-01-29

- Change layout of `package.json` and remove `@uiw/react-color` dependency in
  favor of `@macrostrat/ui-components` color picker

## [3.0.1] - 2026-01-28

Update handling of `@uiw/react-color` dependency

## [3.0.0] - 2026-01-26

- Update bundling process to `@macrostrat/web-components-bundler`
- Drop support for React 16 and 17 (require React 18+)
- Make CSS imports optional; users must now import
  `@macrostrat/data-sheet/style.css` or
  `@macrostrat/data-sheet/dist/data-sheet.css` for styles

## [2.2.4] - 2026-01-20

- Modernize `react-color` dependency
- Modernize data editor handling

## [2.2.3] - 2026-01-17

- Fix issue with column resizing
- Refactored key handlers
- Reduced rendering overhead with `useCallback` and `useMemo`

## [2.2.2] - 2025-12-13

Small typing fixes

## [2.2.1] - 2025-11-28

Internal fixes

## [2.2.0] - 2025-10-29

- PostgREST sheet has full table search ability

## [2.1.1] - 2025-06-25

- Fix issue with exports and Parcel
- Improve some types
- PostgREST sheet: set default ordering to `identityKey` ascending

## [2.1.0] - 2025-06-25

- Add filtering to PostgREST table
- Allow `density` to be set to `"low", "medium", or "high"` to control the size
  of cells and content
- Fixes to mouse interaction, selection, and keyboard navigation
- Rely on `@macrostrat/color-utils` for color management
- Add handling of row deletion
- Add `onUpdateData` and `onSaveData` handlers for better controlled usage

## [2.0.2] - 2025-04-09

Fix some errors with typings

## [2.0.1] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [2.0.0] - 2025-02-14

- New version of the `@macrostrat/data-sheet` library based on
  `@blueprintjs/table` and `@blueprintjs/core`
- Full-featured and customizable virtualized data sheet
- Preliminary support for windowed loading and
  [PostgREST](https://postgrest.org) data fetching
- Standardized approach to tooltips, context menus, and other controls

## [1.0.0] - 2021 to 2024

- Initial release of the `@macrostrat/data-sheet` library based on
  `react-datasheet`
