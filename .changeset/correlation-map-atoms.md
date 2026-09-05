---
"@macrostrat/map-views": minor
---

Drop `zustand-computed` from the column correlation map store. The store stays
a plain `zustand` store, mounted through `@macrostrat/scoped-store`'s
`ZustandStoreProvider`; the values that were computed — the focused columns and
the selection mode — are now jotai atoms selecting into that store
(`focusedColumnsAtom`, `selectionModeAtom`, with `correlationColumnsAtom`,
`focusedLineAtom`, `selectedColumnsAtom`, `hoveredColumnAtom` as the base
selections), so they recompute only when their inputs change. `zustand-computed`
2.1.1 mutates state in place inside `setState`, so zustand's identity guard
stopped notifying subscribers: columns pushed into the store never re-rendered
the map or chart until another update forced it, and removing a column did
nothing.

`useCorrelationMapStore(selector)` keeps working for base fields, actions and
the derived values (the latter arrive from their atoms); `useFocusedColumns`,
`useSelectionMode` and `useCorrelationMapStoreAPI` are the direct routes. New
`setSelectionMode("line" | "manual")` action switches modes explicitly (to
manual seeding the list from the focused columns; to line clearing the
selection). Each `ColumnCorrelationProvider` now owns its store (`inherit:
false`), so a remount reseeds from props — inheriting resolved to jotai's
default store and hydrated once per document, which made a second mount reuse
the first mount's store.

The map no longer re-frames the section on every store update: the fit is keyed
on the line's coordinates and the selected column ids rather than on object
identity (hovering a column used to trigger a fit), and the first fit on load is
a jump rather than an animation.

`zustand-computed` is deprecated across the library; see the State management
section of `AGENTS.md`.
