# Changelog

## [unreleased]

- onClick capability added to LithologyTag, where event returns field `lith_id` with corresponding lith_id
- onClick capability added to IntervalTag, where event returns field `int_id` with corresponding int_id

## [0.1.0] - 2025-04-09

- Added fields for data and tags, which can be used for rendering lists of
  complex lithology, interval, and other information from Macrostrat.
- Added helper components for comma-separated lists

## [0.0.6] - 2025-02-14

Add `node` target to bundle without imported CSS

## [0.0.5] - 2025-01-04

- Migrate from `vx` to `visx` for charts
- Update `@macrostrat/hyper` to version 3
- Remove unused dependencies
- Remove unused build scripts
- Add basic data fields
- Add field locations (Rockd and StraboSpot checkins)
