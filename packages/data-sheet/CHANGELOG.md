# Changelog

## [4.6.0] - 2026-09-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.5.2...@macrostrat/data-sheet-v4.6.0)

### Minor Changes

- Hoist `MasonryScrollBody` into the library (measured, append-only column
  balancing, optional responsive columns), and stop counting loading skeletons
  as layout items — `ScrollBodyProps` now carries them as `placeholders`.

## [4.5.2] - 2026-08-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.5.1...@macrostrat/data-sheet-v4.5.2)

### Patch Changes

- Update data panel styles again

## [4.5.1] - 2026-08-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.5.0...@macrostrat/data-sheet-v4.5.1)

### Patch Changes

- Update sizing of data panel toolbars

## [4.5.0] - 2026-08-26 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.4.1...@macrostrat/data-sheet-v4.5.0)

### Minor Changes

- Starting a view somewhere other than the beginning — three additions that each
  [051e06fb](https://github.com/UW-Macrostrat/web-components/commit/051e06fb5b29bdeb2a2239829f5429b272ff5ab1)
  remove a wasted request:

  - **`TableDataProvider.distinctValues(columnKey, options?)`** — the values a
    column actually holds, with frequencies where the source reports them. A
    value picker can then offer only choices that match something, instead of a
    free-text box (or a hand-rolled scan of the table). Implemented for both
    built-in providers: `createLocalProvider` counts in memory, and
    `createPostgRESTProvider` uses a grouped aggregate query
    (`select=col,count()`), so one small request returns the whole vocabulary.
    `baseFilter` applies to it; the _active_ filters deliberately don't — a
    picker whose options vanish as you narrow the view can't be used to widen it
    again. New `useDistinctValues(columnKey)` /
    `useDistinctValueList(columnKey)` hooks read it, cached per (provider,
    column, refresh token) so controls that mount and unmount with a menu don't
    each pay for a request, and a provider mutation refreshes the vocabulary.
    Also exported: `distinctValuesOf(rows, columnKey)` for in-memory sources.
  - **`initialFilters` / `initialSorts`** on any data view — view state applied
    when the store is _created_, so a restored view (a link, a saved query, a
    server render) issues one correct fetch. Applying the same state from an
    effect, which was the only option before, always let the unfiltered first
    page go out and immediately superseded it: a wasted round-trip and a flash
    of the wrong rows on every linked view. Uncontrolled — later user changes
    win.
  - **`initialData`** — rows already in hand for the first window, so a
    server-rendered page doesn't re-request what it just shipped. Accepts bare
    rows or `{ rows, totalCount }`; with a total, the sparse array is pre-sized,
    so the scrollbar and the counter are right from the first paint. The loader
    starts `initialized` (no empty-state flash, no mount fetch); scrolling past
    the seed loads normally, and any view change discards it — the seed only
    describes the view it was fetched for, so pair it with matching
    `initialFilters` / `initialSorts`.

  Also: **`useLoadControls()` now exposes `page`, `pageSize`, and `totalPages`**
  (the loader already computed them; the footer contract dropped them). A footer
  can now render a real _link_ to the next page rather than only a button that
  calls `loadMore` — which is what a crawler, or a client with no JavaScript,
  can actually follow.

  New story `Data sheet/Data panel/Initial state` demonstrates all three against
  a provider that logs every request, so the saving is visible rather than
  asserted — including the realistic combination (server resolves the view from
  the URL, fetches that page, ships both) where the client mounts with no
  request at all.

## [4.4.1] - 2026-08-26 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.4.0...@macrostrat/data-sheet-v4.4.1)

### Patch Changes

- Fix the Filter tag's scope, and make the clear buttons drop stale row
  selections:

  - **The "Filter" tag no longer speaks for `"inline"` filters.** Its active
    state and its clear button covered _every_ active filter, including ones
    with `presentation: "inline"` — which have their own always-visible toolbar
    control. So an open search box lit up the Filter tag it isn't in, and the
    tag's ✕ (which reads as "clear the filters in here") silently emptied the
    search box too. Both are now scoped to the filters the menu actually holds.
  - **The Filter and Sort clear buttons go through the store's actions**
    (`clearFilters` / `clearColumnSorts`) instead of writing state directly, so
    they also drop a row selection the cleared view made meaningless — the same
    guarantee `setFilter` and `setColumnSort` got in 4.4.0. Reachable on a view
    with non-modal selection, where selecting and filtering coexist.
  - Tidied a `??`/`>` precedence accident in the two indicator atoms
    (`x?.size ?? 0 > 0` parses as `x?.size ?? (0 > 0)`; it happened to behave).

- Improve styles for the inline filter menu.

## [4.4.0] - 2026-08-26 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.3.0...@macrostrat/data-sheet-v4.4.0)

### Minor Changes

- View-control placement, modal-selection fixes, and cmd-click selection
  (`DataPanel`):

  - **`viewControls: "inline" | "popover"`** — where the built-in view controls
    (inline filters, the Filter menu, the Sort menu) sit in the toolbar.
    `popover` collapses all of them behind one button, for a narrow or
    deliberately chrome-light toolbar. Same controls, same store seam; only
    placement changes — the `TableFilter.presentation` idea applied to the
    toolbar as a whole.
  - **The view controls get out of the way while selecting.** On a
    modal-selection view, entering select mode replaces them with a single
    **Filter** control that _leaves_ select mode, handing the toolbar to the
    selection and its set-actions. Filtering and selecting no longer compete for
    the toolbar — or for each other's correctness (below).
  - **A view change drops row selections.** `setFilter` / `removeFilter` /
    `clearFilters` / `setColumnSort` / `clearColumnSorts` now clear the
    row-addressed parts of the selection: rows are selected _by index_, so a
    re-filter or re-sort leaves "rows 3–5" pointing at different records, and a
    set-action would silently act on the wrong ones. Column selections survive
    (they're index-stable, and the sheet's own sort/filter controls are invoked
    from a column selection).
  - **Cmd/ctrl-click enters select mode** on a modal-selection `DataPanel` and
    selects the clicked row — the familiar list idiom, so a bulk action no
    longer requires finding the Select control first.
  - **Modal selection state is no longer clobberable.** It lived in
    `interactionOptionsAtom`, which the provider re-syncs from props on every
    render (`resolveInteractionOptions` builds a fresh object each time), so any
    provider re-render reset select mode. It now has its own atom
    (`selectionModeActiveAtom`), read through the new `enableSelectionAtom` —
    which is what every selection path should consult from now on.
  - **`MenuDropdown` no longer traps focus, and passes its props through.** It
    hard-coded `enforceFocus: true` and silently dropped extra props (a caller's
    `placement` never applied). The focus trap is what made a filter submenu
    feel unstable: a control whose own typeahead renders in a separate portal
    had focus yanked back out of it.
  - **New `MenuFormItem`** — a titled block inside a menu holding an arbitrary
    form (rather than a submenu), exported so a custom control panel can use the
    idiom `MenuInlineFilterItem` is built on.
  - **`DataPanelToolbarStyle.FLOATING`** — the `"floating"` toolbar style was
    implemented in the stylesheet (and used by consumers) but missing from the
    enum.
  - New story `Data sheet/Data panel/View controls`, with `viewControls`,
    `toolbarStyle`, and `enableSelection` as arg controls — the three are
    coupled (how much toolbar there is decides whether inline controls fit, and
    modal selection is what makes them step aside), so the story is a matrix to
    try rather than one arrangement per story.

## [4.3.0] - 2026-07-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.2.1...@macrostrat/data-sheet-v4.3.0)

### Minor Changes

- Create a `@macrostrat/scoped-store` library:
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
  - Move Jotai scope and enhancements to a separate package (formerly part of
    `@macrostrat/data-components`).
  - Add extensions for Zustand coordination (`ZustandStoreProvider`,
    `useZustandSelector`, `useZustandStoreAPI`).

### Patch Changes

- Graceful degradation on load errors. A failed `fetchData` (e.g. the whole
  PostgREST route returning 401) was caught but never surfaced — the panel sat
  blank. Now the load error flows through `tableFooterAtom` /
  `useLoadControls().error`; `LoadProgressIndicator` shows a compact error chip,
  and `DataPanel` shows a "Couldn't load data" `NonIdealState` (and a "No
  results" state for a genuinely empty result) instead of a perpetual spinner or
  an empty list.
  [20a49359](https://github.com/UW-Macrostrat/web-components/commit/20a493594c3813c14462dd997f5f58c7ed89f102)
- Smoother windowed loading (workstream H):
  [83dbc89f](https://github.com/UW-Macrostrat/web-components/commit/83dbc89f269ee462ffd3419268844cc76a1f2653)

  - **`filterDebounce`** (ms) on `DataSheet` / `DataPanel` — debounces the
    view-state → refetch, so typing in a text filter no longer resets and
    refetches on every keystroke. The input (and store) stay instant; only the
    fetch waits for the view to settle. Scroll paging is unaffected. Default `0`
    keeps immediate refetching.
  - **`DataPanel` skeleton rows** — the panel used to _skip_ the loader's `null`
    placeholder rows, so a view change flashed the list blank while the sheet
    showed skeletons. It now renders bounded shimmer cards where the loading
    page's rows will land (on a view change and on the next scroll page), so the
    body height stays stable — no blank flash, no footer pinging up into the
    scroll flow. The end region also holds a constant min-height.
  - **No empty-state flash** — `useLoadControls()` now exposes `initialized`;
    the "No results" state shows only after a fetch settles empty, not during
    the reset→fetch gap.

- Toolbar + filter presentation:
  [20a49359](https://github.com/UW-Macrostrat/web-components/commit/20a493594c3813c14462dd997f5f58c7ed89f102)

  - **`TableFilter.presentation`** (`"menu"` | `"menu-inline"` | `"inline"`) —
    progressive enhancement over the same `filterForm`, choosing where a filter
    surfaces without changing its state/wiring:
    - `"menu"` (default): a menu item whose submenu holds the form (today's
      behavior).
    - `"menu-inline"`: the form renders directly in the Filter menu (no submenu)
      — for compact controls like a segmented picker.
    - `"inline"`: the form renders as an always-visible toolbar control (no
      menu) — for a common always-on control like a text search.
  - **`DataPanel` now surfaces the table-level `filters` prop** (previously
    dropped), splitting them by `presentation` — inline filters become
    always-visible toolbar controls, the rest join the "Filter" menu.
    Column-declared filters are unchanged (default `"menu"`).
  - New exports: **`InlineFilterControl`** (renders any filter's `filterForm`
    inline, wired to the shared filter state) and **`MenuInlineFilterItem`**
    (renders a filter's form directly in a menu).
  - Action buttons (`RunActionButton` + the details-form trigger) render
    `minimal` + `small`, matching the toolbar's other controls; and
    `ActionsToolbar` renders when given custom `children` even with no
    displayable actions.
  - **`DataPanel` title** is now `compact`: it renders only when modal selection
    is toggle-able (or a selection is active), since the title doubles as the
    modal-selection control — no bare label when selection is off.
  - **Flat sort menu** — `ColumnSortMenu` is a single item (no
    Ascending/Descending submenu): direction shows as an icon, an active sort
    reads through the `primary` intent, clicking toggles the direction, and a
    right-aligned ✕ clears it.
  - **Explicit empty `columnSpec` is respected** — an explicitly-passed spec
    (function or array, _including `[]`_) now suppresses the loader's
    first-chunk auto-generation. `columnSpec: []` means "no facet columns" (e.g.
    a browse panel whose only control is a sheet-level filter), not "generate
    from the data". Auto-gen still runs when no `columnSpec` is passed.

- Updated dependencies
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
- Updated dependencies
  [155a855c](https://github.com/UW-Macrostrat/web-components/commit/155a855c2bf99d6f218735616724ab6f5a362590)
  - @macrostrat/scoped-store@1.0.0
  - @macrostrat/data-components@1.3.0
  - @macrostrat/ui-components@5.1.0

## [4.2.1] - 2026-07-21 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/data-sheet-v4.2.0...@macrostrat/data-sheet-v4.2.1)

### Patch Changes

- Fix two `DataSheet` regressions surfaced by the map-ingestion integration:
  [18b1fe82](https://github.com/UW-Macrostrat/web-components/commit/18b1fe820f562d4ad56ebc014a24d1d2fbdf0340)
  - `enableColumnReordering` now reaches the Blueprint `Table` (drag-reorder was
    never actually enabled).
  - `rowHeaderRenderer` results are wrapped in a `RowHeaderCell` and a nullish
    return falls back to the default row label, per the documented contract
    (previously a nullish return dropped the row header entirely).

## [4.2.0] - 2026-07-16

Major refactor to data providers

- `DataPanel` — a card-list renderer over the same headless core as `DataSheet`
  (windowed load, view state, selection, set-based actions).
- `DataView` — `view: "table" | "cards"` toggle rendering `DataSheet` or
  `DataPanel` from one shared store, so selection / sort / filter persist across
  the toggle.
- Immediate-edit seam: the action context gains `getSelectedRows()` and
  provider-backed, auto-refreshing `saveRows` / `deleteRows` / `insertRow` /
  `refresh` (wired at the provider from the data provider's mutations).
- Array-column filtering: `cs` ("has") / `ov` ("has any of") operators, offered
  for `dataType: "array"` columns and translated to PostgREST `cs`/`ov`.
- Improved `TableAction` handling and filtering operators.

### PostgREST loader

- Compound keyset pagination for multi-column sorts (replaces independent
  per-column `gt`/`lt`, which dropped rows under a low-cardinality lead sort).
- Order clauses deduped by key (fixes the identity-key `lt`+`gt` deadlock); new
  `identityAscending` option for a default identity-descending order.

### Internal

- `useResolvedProvider` — one provider-resolution path shared by `DataSheet` /
  `DataPanel` / `DataView`; carries `localCount`, so renderers no longer take a
  `data` prop (live rows come only from the store).
- Hoisted to the provider (shared by both renderers): row `identity`,
  `canDeleteRows`, `rowEditing`, `refreshToken`, and function-`columnSpec`
  derivation.
- Removed the dead `table-updates/` module (old `TableUpdate` model; it imported
  web-app ingestion code).

## [4.1.1] - 2026-07-10

Small fixes to the column header, filters, and toolbar. Ghost/skeleton rows
while a provider table loads. `columnSpec` may now be a function of the loaded
rows, so a data-shaped spec needs no separate fetch of sample data.

## [4.1.0] - 2026-07-10

### Controlled editing improvements

- `deriveOverlay(rows)` prop — derive the controlled overlay from loaded rows
  inside the sheet (for provider-owned data with external edit state)
- `onEdit` `setCells` events now carry the base `row`
- `refreshToken` prop to force a provider re-fetch

### Toolbar and status bar improvements

- Global toolbar actions auto-position right (Clear → Reset → Save); contextual
  actions stay left
- Built-in, auto-included `clearSelectionAction`
- Added a `statusBar` prop for bottom bar content
- Column headers dropdowns now use `Menu`
- Sort and filter improvements
- Improved and generalized `rowStatus` handling

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
