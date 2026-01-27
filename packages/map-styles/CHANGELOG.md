# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-26

- Removed import of `mapbox-gl/dist/mapbox-gl.css`, no styles bundled with library.
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
