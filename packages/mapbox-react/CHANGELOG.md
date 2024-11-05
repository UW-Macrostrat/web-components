# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2024-11-05

- Improve the internal design of the `useMapEaseTo` hook
- Add some stories for testing
- Add a `useBasicStylePair` hook for getting a basemap in dark or light mode
- Added deprecation warnings to `useMapEaseToCenter` and `useMapEaseToBounds`

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
