# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-26

- Update bundling process to `@macrostrat/web-components-bundler`
- Drop support for React 16 and 17 (require React 18+)

## [2.2.4] - 2026-01-20

- Modernize `react-color` dependency
- Modernize data editor handling

## [2.2.3] - 2026-01-17

- Fix issue with column resizing
- Refactored key handlers
- Reduced rendering overhead with `useCallback` and `useMemo`

## [2.2.2] - 2025-12-13

Small typing fixes

## [2.2.1] - 2025-11-28

Internal fixes

## [2.2.0] - 2025-10-29

- PostgREST sheet has full table search ability

## [2.1.1] - 2025-06-25

- Fix issue with exports and Parcel
- Improve some types
- PostgREST sheet: set default ordering to `identityKey` ascending

## [2.1.0] - 2025-06-25

- Add filtering to PostgREST table
- Allow `density` to be set to `"low", "medium", or "high"` to control the size
  of cells and content
- Fixes to mouse interaction, selection, and keyboard navigation
- Rely on `@macrostrat/color-utils` for color management
- Add handling of row deletion
- Add `onUpdateData` and `onSaveData` handlers for better controlled usage

## [2.0.2] - 2025-04-09

Fix some errors with typings

## [2.0.1] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [2.0.0] - 2025-02-14

- New version of the `@macrostrat/data-sheet` library based on
  `@blueprintjs/table` and `@blueprintjs/core`
- Full-featured and customizable virtualized data sheet
- Preliminary support for windowed loading and
  [PostgREST](https://postgrest.org) data fetching
- Standardized approach to tooltips, context menus, and other controls

## [1.0.0] - 2021 to 2024

- Initial release of the `@macrostrat/data-sheet` library based on
  `react-datasheet`
