# @macrostrat/map-views

## [1.1.1] - 2026-09-10 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/map-views-v1.1.0...@macrostrat/map-views-v1.1.1)

### Patch Changes

- Require an explicit project scope for column requests. `fetchAllColumns` used
  to
  [0f538d1c](https://github.com/UW-Macrostrat/web-components/commit/0f538d1c0edc5fa9f148f7ff6be3457a38a66132)
  send `all=true` when no project was given, which `/columns` silently ignores —
  the request fell through to the API's core-projects default, so entire
  projects (GBDB's 28,951 columns among them) were absent with nothing to
  indicate it. `projectID` is now required and accepts an id, a list, a
  comma-joined string, or `"all"`; `CORE_COLUMNS_PROJECT_ID` names the API's old
  implicit default, and the map components pass it when given no project.

  Also fixes the in-process filter in `useMacrostratColumns`, which assigned to
  `.features` on what is already an array — so it never filtered, and mutated
  the cache while not doing it. Column features now carry `status`, added to the
  `/columns` response in API v2 2.3.10.

- Updated dependencies
  [0f538d1c](https://github.com/UW-Macrostrat/web-components/commit/0f538d1c0edc5fa9f148f7ff6be3457a38a66132)
  - @macrostrat/data-provider@1.3.0
  - @macrostrat/api-types@1.3.1
  - @macrostrat/stratigraphy-utils@1.4.1

## [1.1.0] - 2026-09-06 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/map-views-v1.0.0...@macrostrat/map-views-v1.1.0)

### Minor Changes

- Drop `zustand-computed` from the column correlation map store. The store stays
  [f30c89fa](https://github.com/UW-Macrostrat/web-components/commit/f30c89fa5887a5f8343b377ee2490be695f3c078)
  a plain `zustand` store, mounted through `@macrostrat/scoped-store`'s
  `ZustandStoreProvider`; the values that were computed — the focused columns
  and the selection mode — are now jotai atoms selecting into that store
  (`focusedColumnsAtom`, `selectionModeAtom`, with `correlationColumnsAtom`,
  `focusedLineAtom`, `selectedColumnsAtom`, `hoveredColumnAtom` as the base
  selections), so they recompute only when their inputs change.
  `zustand-computed` 2.1.1 mutates state in place inside `setState`, so
  zustand's identity guard stopped notifying subscribers: columns pushed into
  the store never re-rendered the map or chart until another update forced it,
  and removing a column did nothing.

  `useCorrelationMapStore(selector)` keeps working for base fields, actions and
  the derived values (the latter arrive from their atoms); `useFocusedColumns`,
  `useSelectionMode` and `useCorrelationMapStoreAPI` are the direct routes. New
  `setSelectionMode("line" | "manual")` action switches modes explicitly (to
  manual seeding the list from the focused columns; to line clearing the
  selection). Each `ColumnCorrelationProvider` now owns its store
  (`inherit: false`), so a remount reseeds from props — inheriting resolved to
  jotai's default store and hydrated once per document, which made a second
  mount reuse the first mount's store.

  The map no longer re-frames the section on every store update: the fit is
  keyed on the line's coordinates and the selected column ids rather than on
  object identity (hovering a column used to trigger a fit), and the first fit
  on load is a jump rather than an animation.

  `zustand-computed` is deprecated across the library; see the State management
  section of `AGENTS.md`.

  Column map colors are now themeable with CSS custom properties, read from the
  map's container when it mounts: `--column-map-color` (footprints),
  `--column-map-hover-color` (hovered / highlighted column),
  `--column-map-selection-color` (the navigation map's selected column and
  keyboard-navigation links) and `--column-map-focus-color` (the correlation
  map's focused columns and their order line). Defaults are unchanged (subtle
  text color, purple, purple, red). `InsetMap` and the maps built on it also
  take explicit `mapColors`; `useColumnMapColors` exposes the resolved set to
  custom layers. See the "Theming / Selection colors" story in column-views.

## [1.0.0] - 2026-09-01

### Major Changes

- Created the @macrostrat/map-views module for specific map interactions and
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
  high-level views around Macrostrat maps.

### Minor Changes

- Improve the internal structure of the correlation map store
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)

### Patch Changes

- Updated dependencies
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)
- Updated dependencies
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)
- Updated dependencies
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Updated dependencies
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)
  - @macrostrat/mapbox-react@3.4.0
  - @macrostrat/scoped-store@1.1.0
  - @macrostrat/api-types@1.3.0
  - @macrostrat/map-interface@2.4.0
