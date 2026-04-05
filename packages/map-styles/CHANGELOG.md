# Changelog

## [2.1.2] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/map-styles-v2.1.1...@macrostrat/map-styles-v2.1.2)

### Patch Changes

- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7

## [2.1.1] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/map-styles-v2.1.0...@macrostrat/map-styles-v2.1.1)

### Patch Changes

- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/ui-components@5.0.6

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-06

- Add dependency on `maplibre-gl` to support unified type definitions
- Upgrade `mapbox-gl` dependency to v3
- Add new capabilities for FGDC pattern resolving
- Add `StyleFragment` and `StyleSpecifier` export types

## [2.0.1] - 2026-01-29

- Change layout of `package.json` and explicitly mark no side effects.

## [2.0.0] - 2026-01-26

- Removed import of `mapbox-gl/dist/mapbox-gl.css`, no styles bundled with
  library.
- Changed bundling of library to use `@macrostrat/web-components-bundler`.
- Updated peer dependencies to React 18.

## [1.2.4] - 2025-11-28

- Fix a NaN comparison bug in resolveFGDCImage

## [1.2.3] - 2025-11-02

- Added `setupStyleImageManager` function and associated utilities to manage
  style images
- Began adding more streamlined code for map symbol management
- Added utilities for loading SVG-based map symbols

## [1.2.2] - 2025-10-05

- Add `pointSymbolIndex` to allow custom loading of symbols by external code
- Add `sample_locality` and `fold_axis` symbols

## [1.2.1] - 2025-06-25

Small improvements to types and styles

## [1.2.0] - 2025-04-09

Add `buildCrossSectionLayers` function

## [1.1.2] - 2025-02-23

- Small update to types

## [1.1.1] - 2025-02-15

Added `files` specifier to `package.json` to ensure that all `dist` files are
included in the package.

## [1.1.0] - 2025-02-14

- Move some React-specific elements to the `@macrostrat/mapbox-react` package
- Improve typings
- First NPM release

## [1.0.3] - 2025-02-04

- Change name to `@macrostrat/map-styles` from `@macrostrat/mapbox-styles`

## [1.0.2] - 2024-10-24

- Update `axios` version
- Fix package specifiers
