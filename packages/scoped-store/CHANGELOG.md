# @macrostrat/scoped-store

## [1.1.0] - 2026-09-01 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/scoped-store-v1.0.1...@macrostrat/scoped-store-v1.1.0)

### Minor Changes

- `ZustandStoreProvider` passes an `inherit` prop through to the underlying
  scoped provider
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)

## [1.0.1] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/scoped-store-v1.0.0...@macrostrat/scoped-store-v1.0.1)

### Patch Changes

- Remove createStateIsolation and associated exports from
  `@macrostrat/data-components`; move them to `@macrostrat/scoped-store`.

## [1.0.0] - 2026-07-27

### Major Changes

- Create a `@macrostrat/scoped-store` library:
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
  - Move Jotai scope and enhancements to a separate package (formerly part of
    `@macrostrat/data-components`).
  - Add extensions for Zustand coordination (`ZustandStoreProvider`,
    `useZustandSelector`, `useZustandStoreAPI`).
