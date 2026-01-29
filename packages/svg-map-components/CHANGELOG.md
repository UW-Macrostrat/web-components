# Changelog

## [2.0.1] - 2026-01-29

- Change layout of `package.json` and explicitly mark no side effects.

## [2.0.0] - 2026-01-26

- Change bundling process to use `@macrostrat/web-components-bundler`
- Update peer dependencies to React 18
- Globally apply styles instead of importing separately

## [1.0.7] - 2025-11-29

Small update to types.

## [1.0.6] - 2025-10-29

Remove use of `findDOMNode`

## [1.0.5] - 2025-06-25

Update types and dependencies

## [1.0.4] - 2025-04-09

Added a `pointRadius` prop to `Feature`s to allow points to be shown

## [1.0.3] - 2025-02-15

Add `node` target to bundle without imported CSS.

## [1.0.2] - 2025-02-14

- Fix an issue with map sizing (height was mistakenly set to width).
- Upgrade D3 dependencies to latest
  [v6](https://observablehq.com/@d3/d3v6-migration-guide) versions

## [1.0.1] - 2025-02-14

- Added `src` files to deployment package.

## [1.0.0] - 2025-02-04

- Renamed to `@macrostrat/svg-map-components` to avoid confusion with other map
  libraries.
- Moved some UI components to `@macrostrat/ui-components` package.
- Improved typings and documentation.

## [0.2.1]

- Add better state handling and ability to reset projection.
- Last release as `@macrostrat/map-components`

## [0.2.0] August 2020

- Improve typings
- Fix bug with projection clipping and `Sphere` geometry.

## April 2020

- Complete move towards typescript
- Update bundler strategy

## December 2019

- Initial vendorization of library for use in column renderer widget

## Summer 2019

- Code created as part of `corelle` project
