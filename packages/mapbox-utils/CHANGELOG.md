# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.2] - 2026-02-06

- Update Mapbox dependency to v3
- Improved style helper functions

## [1.7.1] - 2026-01-29

- Change layout of `package.json` and explicitly mark no side effects.

## [1.7.0] - 2026-01-26

- Change bundling process to use `@macrostrat/web-components-bundler`

## [1.6.1] - 2025-11-28

- Update `parcel` bundler

## [1.6.0] - 2025-07-02

- Add functions to manage focus state and map positioning, inherited from
  `@macrostrat/mapbox-react`
- Add new `updateStyleLayers` helper that merges layers into a map style at
  runtime

## [1.5.1] - 2025-06-25

- Fix `getMapPosition` and `setMapPosition` functions
- Upgrade dependencies and types

## [1.5.0] - 2025-04-09

- Improve `removeMapLabels` function
- Add `buildGeoJSONSource` and `removeSourceFromStyle` function

## [1.4.0] - 2025-02-14

- Add new `setMapPosition` function
- Improved import structure and compilation

## [1.3.2] - 2024-10-24

- Fix package specifier for types

## [1.3.1] - 2024-10-24

- Update `axios` version

## [1.3.0] - 2024-10-02

- Fixed style merging with `mergeStyles`
- Added `formatCoordForZoomLevel`, `metersToFeet`, and several other utility
  functions
