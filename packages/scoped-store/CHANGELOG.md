# @macrostrat/scoped-store

## [1.0.0] - 2026-07-27

### Major Changes

- Create a `@macrostrat/scoped-store` library:
  [f1bb8214](https://github.com/UW-Macrostrat/web-components/commit/f1bb8214b97668a4c4107d1d6faceb648f91f2b4)
  - Move Jotai scope and enhancements to a separate package (formerly part of
    `@macrostrat/data-components`).
  - Add extensions for Zustand coordination (`ZustandStoreProvider`,
    `useZustandSelector`, `useZustandStoreAPI`).
