# Changelog

## [1.1.6] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/api-types-v1.1.5...@macrostrat/api-types-v1.1.6)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updates to internal typings
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-01-26

Removed local `tsconfig.json` file and Parcel dependency.

## [1.1.4] - 2025-12-19

Increase alignment of GeoJSON types

## [1.1.3] - 2025-11-28

- Update `MacrostratInterval` and `Interval` types

## [1.1.2] - 2025-08-22

- Added types for `StratName` and `StratNameConcept`

## [1.1.1] - 2025-06-25

- Add type for `Interval`
- Add optional `prop` field to `Lithology` type

## [1.1.0] - 2025-04-09

- Add types for `Environment`, `Lithology`, `MacrostratRef`, and
  `ColumnGeoJSONRecord`
- Improve types for `UnitLong`
- Add a `UnitLongFull` type to allow access to deprecated fields

## [1.0.0] - 2025-02-14

First public release of the API types package, including types for columns,
units and measurements for Macrostrat's v2 API.
