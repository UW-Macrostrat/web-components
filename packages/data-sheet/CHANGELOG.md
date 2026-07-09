# Changelog

## [Unreleased]

Start of the v4 evolution roadmap (see `README.md` → _Evolution roadmap_).

### Cell validation

- **`columnSpec[].validate(value, row, ctx)`** returns `{ severity, message } |
  null` (`"warning"` | `"error"`); **`required`** is sugar for an empty-is-error
  check. The bare `isValid` boolean is deprecated in favor of `validate`.
- Validation is **orthogonal to edit status** — exposed on
  `CellRenderContext.validation` (a cell can be edited *and* invalid). The cell
  intent is derived with precedence **error → warning → deleted → edited**, so
  an edited-but-invalid cell reads red, not green.
- **Errors block saving** (warnings don't): the built-in Save action refuses
  when `collectValidationErrors` finds any error, surfacing a summary; the
  offending cells are already highlighted. _Story:_ `Data sheet/Validation`.

### Cardinality-scoped controls (backbone, in progress)

- **Modality by selection cardinality — via `TableAction`.** Rather than a
  parallel abstraction, `TableAction` gained an optional `render(ctx)` for
  live/stateful controls (`run` is now optional). The existing `ActionsToolbar`
  surfaces exactly the actions whose `targets` match the current selection, and
  shows a **capsule** (Column / Rows / Cells / Table) naming the polarity.
- **Scoped by selection *shape*, not just cardinality.** `TableAction` gained
  `appliesTo(ctx)`, refining `targets` against the selection shape. The context
  exposes **resolved single-target identity** — `ctx.columnKey`, `ctx.rowIndex`,
  `ctx.cell` (each `null` unless exactly one is scoped) — plus counts on
  `ctx.selectionShape` (`cardinality`, `columns`, `rows`). Presence of the
  resolved fields is the discriminator, so there are no `single*` booleans:
  sort/filter use `appliesTo: ctx => ctx.columnKey != null`; a cell editor uses
  `ctx.cell != null` and reads `ctx.cell.{rowIndex,columnKey}` to adapt to the
  specific cell — one control, active for every cell, addressing its identity.
- **Built-in column controls** `columnControlActions` (sort + filter) are
  `FULL_COLUMNS` `TableAction`s with `render`, gated by `sortable`/`filterable`
  and overridable. Sort is a compact popover (Ascending / Descending / Clear);
  filter is a popover whose text box clears itself. The toolbar's focus is
  actions that _aren't_ keyboard-accessible (clearing/deleting stay on the
  keyboard).
- **Toolbar layout.** The toolbar leads with a text **title** naming the
  selection shape (e.g. a column's name, "3 rows", "Cell") — no icon capsule —
  and sits **below** the global sort/filter status bars.
- **Column-header dropdown driven by the same actions.** The header menu now
  renders the `FULL_COLUMNS` controls from the shared registry, scoped to that
  column (a synthetic single-column context) — one source of truth for header
  and toolbar; the bespoke header menu is retired. The built-in column controls
  are auto-included (overridable by reusing their id). The header uses
  Blueprint's **persistent interaction bar**, so the menu caret is clickable
  even when the column is selected (fixes the hover-caret-blocked bug).
  _Stories:_ `Data sheet/Controls`, `Data sheet/Filters`.
- **Built-in Save / Reset actions.** The existing `resetChangesAction` now
  targets every cardinality (incl. `"none"`), and a Save action (via the new
  `onSave` prop) does too — so for editable tables they're always present,
  keeping the toolbar mounted regardless of selection (no show/hide layout
  motion). They render **last** (most significant), and **Reset is greyed out
  unless there are pending changes within the applicable selection** (scoped:
  cells / rows / columns / whole table). `onSave` receives the action context.
- **Toolbar omits keyboard-accessible actions.** Any action with a `hotkey`
  (copy/cut/paste, …) is left out of the toolbar — it's reachable via its
  shortcut — so the toolbar focuses on non-keyboard actions. (Reset lost its
  `mod+r`, which conflicted with reload, and now shows in the toolbar.)
  _Story:_ `Data sheet/Controls` → `ModalByCardinality`.
  _(Next — the major step: migrate all examples onto this API. Then: sort/filter
  popover/collapse render style; group-by/hide as built-in controls; context
  menus. Deferred: an actions queue + proxied column copy/paste.)_

### Data source & view state (`fetchChunk` loader)

- **Unified `fetchChunk` data source.** `useChunkLoader(fetchChunk, {chunkSize})`
  (and the `ChunkLoaderManager` convenience component) drive windowed loading
  from a single backend-agnostic function:
  `fetchChunk({ offset, limit, sorts, filters, signal }) → { rows, totalCount? }`.
  It loads the chunk covering the first unloaded visible row, pre-sizes the
  sparse array from `totalCount` (or grows when length is unknown), threads the
  active sorts/filters through so the source applies them server-side, aborts
  superseded requests, and re-fetches from scratch on a view-state change. This
  is the seam that upstreams bespoke lazy loaders. _Story:_
  `Data sheet/Chunk loader` → `ServerBackedTable`.
- **Fixed: column-header sort/filter menu never rendered.** `renderColumnHeaderCell`
  had a stray early `return` that short-circuited the whole renderer, so no
  column ever got its sort/filter dropdown (sorting was inaccessible — filters
  only worked via the separate global "Add filter" bar). Removed it (and a
  latent `activeFilterEntry` typo it was masking).
- **Sort/filter creation lives in the column headers**, not a universal "add"
  button. Sort/filter directives are created and reconfigured from each
  column's header dropdown; the sort/filter bar just shows removable tags. Sort
  labels now read "Ascending"/"Descending" (type-agnostic) rather than
  "A→Z"/"Z→A". Removed the "Clear all" / "Clear filters" buttons — each tag's
  `×` clears it individually. _Story:_ `Data sheet/Filters`.
- **Delete/Backspace on a whole-row selection deletes the row(s)**; on a cell
  selection it clears the cells (previously it always cleared cells).
- **Filter tags show their window.** `TableFilter.describeState(state)` renders
  the current setting (e.g. `Depth: 0–250`) on the active-filter tag, so a tag
  conveys not just _what_ is filtered but the current window. _Story:_
  `Data sheet/Filters`.
- **Optional load-progress indicator.** `showLoadProgress` renders a minimal
  bottom-of-table line — rows loaded, "of _total_" when known, with a status
  icon (spinner loading / check complete / dots incomplete), reflecting the
  `useChunkLoader` source. _Story:_ `Data sheet/Chunk loader`.
- **Fetch modes: scroll or paged.** `useChunkLoader(fetchChunk, { chunkSize,
  mode })` accepts `mode: "scroll"` (default; infinite windows) or `"paged"`
  (one page at a time). In paged mode the footer becomes a prev/next pager
  ("Page X of Y") and the table sizes to its rows (content height) rather than
  filling the viewport; `chunkSize` is the tunable page/window size. The mode
  can be flipped at runtime (the loader resets and re-fetches). A good fallback
  for low-interaction contexts. _Stories:_ `Data sheet/Chunk loader` →
  `PagedTable`, `ModeToggle`.
- **Scroll-to-row** works with the `fetchChunk` source: `ScrollToRowControl`
  (backed by the store's `scrollToRow`) scrolls to a row index, which loads the
  covering chunk. Meaningful when the source length is known (offset
  addressing). _Story:_ `Data sheet/Chunk loader` → `ServerBackedTable`.
- **Keyset pagination support.** `fetchChunk` now also receives an optional
  `cursor` — the already-loaded row (and index) immediately before the chunk in
  scroll mode — so a source can page with `WHERE key > cursor` instead of a slow
  `OFFSET`. Offset-based sources ignore it. A chunk that omits `totalCount`
  (`undefined`) now _preserves_ the previously-known total rather than clearing
  it, so keyset pages (which can't re-`count`) keep the sheet's dimensions.
- **`dataRefreshTokenAtom`** — bump it to force the active loader to reset and
  re-fetch from scratch (used after a mutation invalidates loaded rows).
- **`PostgRESTTableView` now runs on the generic `useChunkLoader`.** A new
  `createPostgRESTFetchChunk({ endpoint, table, identityKey, baseOrder,
  baseFilter })` builds a keyset-paginating `fetchChunk` from the PostgREST
  client; the view renders a `ChunkLoaderManager` and re-fetches (via the
  refresh token) when its sort/filter view changes. The bespoke
  `usePostgRESTLazyLoader` (and its `_loadMorePostgRESTData` chain) is retired.
  Delete/save go through an inline client and trigger a re-fetch (replacing the
  optimistic `update-data` merge). _Fix:_ the `filter` prop is now actually
  applied to the query (it was previously dropped into `...rest` and ignored).
- **Removed the redundant lazy-loader test-double.** The `Data sheet/Lazy
  loader sheet` story and its `TestLazyLoaderTableView` / `useTestLazyLoader`
  exports are gone — superseded by `Data sheet/Chunk loader`, which gains an
  `InfiniteScroll` story demonstrating the append-on-scroll (unknown-total)
  shape on `ChunkLoaderManager`.

### Controlled editing

- **`onEdit(event)` hook.** `DataSheet` accepts an `onEdit` callback that fires
  for every user edit as a structured `EditEvent` — `setCells`, `deleteRows`,
  `addRow`, `resetChanges` — in addition to the built-in `updatedData` overlay.
  `rowIndex` is the underlying data-row index (stable under sort/filter). The
  write half of the read/write contract: consumers capture edits as revertible
  operations instead of diffing `updatedData`. Additive. _Story:_
  `Data sheet/Controlled editing` → `EditEvents`.
- **Controlled `updatedData` / `rowStatus` overlay.** Pass these props to own
  edit state externally (e.g. an ops model): they're synced into the store as
  the source of truth, so pairing them with `onEdit` gives a full controlled
  loop (edit → `onEdit` → your state → back down). Optimistic in-table edits
  are superseded by the value you pass back. _Story:_
  `Data sheet/Controlled editing` → `ControlledOverlay`.
- **Unified `cellDetail` / `detailPresentation` surface API.** A single
  `columnSpec[].cellDetail(ctx)` renders a cell's surface as an **editor** when
  `ctx.editable` and a **read-only viewer** otherwise (ctx carries `onChange` /
  `resetValue` / `close`), superseding `dataEditor` / `detailRenderer` /
  `editorForCell` (still supported, now deprecated). Presentation is orthogonal
  via `detailPresentation: "popover" | "modal" | "inline"` — so modal overlays
  and inline/omnibar surfaces add no new content props, and the same component
  composes into a future row editor. _Story:_ `Data sheet/Cell detail`.

### Editor UX

- **Per-cell editor selection.** A new `columnSpec[].editorForCell(ctx)` picks
  the editor for an individual cell from its `CellRenderContext`, overriding
  the static `dataEditor` / `inlineEditor` — e.g. show a textarea only for
  cells whose value is long. Returned keys are respected even when `false` /
  `null`; omit a key (or return `undefined`) to fall back to the static
  column config. Additive. _Story:_ `Data sheet/Editors` → `PerCellEditor`.
- **`cellInteraction` mode + focus flow-through + read-only detail panels.**
  New table prop `cellInteraction: "auto" | "manual"` governs how selecting a
  cell activates its _surface_ — an editor **or** a read-only detail panel.
  Replaces the editor-specific `editorInteraction`. Defaults from
  `autoFocusEditor` (`true` → `"auto"`, `false` → `"manual"`); `autoFocusEditor`
  is now deprecated.
  - **Flow-through focus.** In `"auto"`, a text editor focuses on selection but
    arrow keys move **within** the text and only hand off to the table at the
    boundary (cursor at start → ↑/←; at end → ↓/→), in one press. Applies to
    the inline editor and `EditableTextArea`.
  - **Escape → navigation mode.** Escape (or an edge hand-off) returns keyboard
    focus to the table so arrows navigate, and suppresses auto-activation until
    the next click — so cancelling one cell prioritizes fast navigation.
    Clicking a cell re-arms auto-activation.
  - **Direction-of-travel cursor.** Entering a text cell via ↓/→ places the
    cursor at the end; via ↑/← at the start — so continuing in the same
    direction leaves the cell with one more press.
  - **Keyboard entry.** In navigation mode, `Enter` enters edit mode (opens +
    focuses the surface, Google-Sheets style); while a surface is open it
    advances downward as before. `F2` also opens/focuses. Clicking an
    already-open cell dismisses its surface.
  - **Read-only detail panels.** New `columnSpec[].detailRenderer(ctx)` renders
    a popover surface that opens/closes with the same machinery but never takes
    keyboard focus (arrow keys keep navigating). For previews/summaries/links.
  - Shared focus state (table element, arming, travel direction) now lives in
    the store; removed the internal focus-stealing hidden input in
    `EditorPopup` that silently broke arrow navigation.

  _Stories:_ `Data sheet/Editors` → `EditorInteractionAuto` / `Manual`;
  `Data sheet/Detail panels` → `AutoDetailPanel` / `ManualDetailPanel`.

### Rich cell-render context

- **Per-cell renderers now receive a `CellRenderContext`.** `valueRenderer`
  takes an optional second argument `{ value, rowIndex, colIndex, column, row,
  isEdited, isDeleted }`, and a custom `cellComponent` receives the same object
  as a `cellContext` prop. `rowIndex` is the underlying data-row index (stable
  under sort/filter), so renderers can style based on sibling columns or edit
  status — and, with the editing API, address a specific cell. Additive: the
  default Blueprint `Cell` is unaffected and existing single-argument
  `valueRenderer`s keep working. _Story:_ `Data sheet/Cell rendering`.

### Editing bugfixes

- **No phantom "edited" state.** `onCellEdited` treats `""` and
  `null`/`undefined` as equivalent, and compares non-blank values by string
  form — so focusing/blurring an empty cell, or retyping an integer's existing
  value (`"42"` vs `42`), no longer marks the cell edited. Real changes still
  register. _Story:_ `Data sheet/Editing` → `EmptyCellNormalization`.
- **Filter-aware bulk edits.** `clearSelection`, `onSelectionEdited`, and the
  fill-handle (`fillValues`) now map visible selection indices to the
  underlying data rows, so bulk edits target the correct rows when a sort or
  filter is active. Whole-column edits now cover **all** rows (the row count is
  taken from `data`, not the sparse `updatedData`, which previously stopped at
  the last already-edited row). _Story:_ `Data sheet/Editing` →
  `EditsUnderSortAndFilter`.
- **`col.style` is no longer mutated.** `basicCellRenderer` clones the
  column-spec `style` before applying deleted-row styling, so a shared style
  object isn't mutated across cells.
- **Removed the dead `onSaveData` prop.** It was declared on `DataSheet` but
  never invoked; saving is driven by table actions. Consumers relying on it
  were already no-ops. (Breaking, but within the `4.0.0` pre-release line.)

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
