# Changelog

## [2.0.3] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/static-map-utils-v2.0.2...@macrostrat/static-map-utils-v2.0.3)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7
  - @macrostrat/mapbox-react@3.1.3

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2026-02-06

Updated Mapbox GL dependency

## [2.0.1] - 2026-01-29

- Change layout of `package.json`

## [2.0.0] - 2026-01-26

- Change bundling process to use `@macrostrat/web-components-bundler`
- Update peer dependencies to React 18

## [1.0.2] - 2025-11-28

- Remove map state watchers that duplicate `@macrostrat/mapbox-utils`
  functionality
- Reorganize utility functions

## [1.0.1] - 2025-11-02

- Move `setupStyleImageManager` function and associated utilities to
  `@macrostrat/map-styles` package.
- Improve inset map examples.

## [1.0.0] - 2025-10-29

- Initial release of the `@macrostrat/static-map-utils` library
- Utilities for calculating the bounds of tiled maps
- Functions for rendering scale bars on static maps
- Helpers for working with Maplibre GL JS
