# Changelog

## [3.2.0] - 2026-04-10 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/mapbox-react-v3.1.3...@macrostrat/mapbox-react-v3.2.0)

### Minor Changes

- Add `ScaleControl` and `GeolocationControl` to `@macrostrat/mapbox-react` so
  they can be used on an "a la carte" basis. `@macrostrat/map-interface` now
  imports and re-exports these controls from `@macrostrat/mapbox-react`.
  [492f5f2f](https://github.com/UW-Macrostrat/web-components/commit/492f5f2f861d4d64af2b9fc378a4878286e89208)

### Patch Changes

- Updated dependencies
  [492f5f2f](https://github.com/UW-Macrostrat/web-components/commit/492f5f2f861d4d64af2b9fc378a4878286e89208)
- Updated dependencies
  [492f5f2f](https://github.com/UW-Macrostrat/web-components/commit/492f5f2f861d4d64af2b9fc378a4878286e89208)
  - @macrostrat/map-styles@2.2.0

## [3.1.3] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/mapbox-react-v3.1.2...@macrostrat/mapbox-react-v3.1.3)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7
  - @macrostrat/map-styles@2.1.2

## [3.1.2] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/mapbox-react-v3.1.1...@macrostrat/mapbox-react-v3.1.2)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/ui-components@5.0.6
  - @macrostrat/map-styles@2.1.1

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-03-31

Upgrade dependencies

## [3.1.0] - 2026-02-13

- Add an overlay style manager to the map context for managing the addition of
  custom style fragments.
- Improve the handling of terrain layers to reduce reloading of layers

## [3.0.2] - 2026-02-06

- Update Mapbox dependency to v3

## [3.0.1] - 2026-01-29

- Change layout of `package.json` and explicitly mark no side effects.

## [3.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Bundling process updated to `@macrostrat/web-components-bundler`
- Globally apply styles instead of importing separately

## [2.6.4] - 2025-11-28

- Upgrade `parcel` bundler

## [2.6.3] - 2025-08-19

- Improve typings for `useMapRef` hook

## [2.6.2] - 2025-07-02

- Move internal functions for managing focus state to the
  `@macrostrat/mapbox-utils` package

## [2.6.1] - 2025-06-25

- Small improvements to types and styles

## [2.6.0] - 2025-04-09

- Add `getTerrainLayerForStyle` function
- Improve style loading management
- Improve types of location focus state

## [2.5.1] - 2025-02-23

- Create new functions for managing terrain layers
- Incorporate all terrain management from `@macrostrat/map-interface`

## [2.5.0] - 2025-02-14

- Add line and point symbol layers (originally from `@macrostrat/mapbox-styles`)
  package
- Streamline types

## [2.4.0] - 2024-11-16

- Improve state management using a `zustand` store

## [2.3.0] - 2024-11-05

- Improve the internal design of the `useMapEaseTo` hook
- Add some stories for testing
- Added deprecation warnings to `useMapEaseToCenter` and `useMapEaseToBounds`
- Add a `useBasicStylePair` hook for getting a basemap in dark or light mode

## [2.2.3] - 2024-10-24

- Added package specifier for types

## [2.2.2] - 2024-10-24

- Update `@turf/--` dependencies

## [2.2.1] - 2024-10-02

- Fix package specifiers

## [2.2.0] - 2024-10-02

- Remove hard dependency on BlueprintJS version
- Improve map control components
- Add `useMapConditionalStyle`, `useMapStyleOperator`, and `useMapClickHandler`
  hooks
- Mark `useMapEaseToCenter` as deprecated in favor of new `useMapEaseTo` hook
