# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
