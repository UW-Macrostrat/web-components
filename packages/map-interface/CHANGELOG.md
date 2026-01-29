# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-01-28

Add rollup interop to fix CommonJS dependency linking issues

## [2.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Convert last remaining Stylus to Sass
- Update bundling process to `@macrostrat/web-components-bundler`
- Make styles optional: import of `@macrostrat/map-interface/styles.css` or
  `@macrostrat/map-interface/dist/map-interface.css` is now required for styles

## [1.6.0] - 2025-11-28

- Update XDD panel components to remove Typescript
- Remove circular dependencies
- Move `LngLatCoords` and `Elevation` components to
  `@macrostrat/data-components`

## [1.5.7] - 2025-08-19

- Remove a duplicate export

## [1.5.6] - 2025-08-01

- Fossils component just show data, not panel
- Better error handling for components

## [1.5.5] - 2025-08-01

- Macrostrat linked data error handling

## [1.5.4] - 2025-07-31

- Nested xdd panel expansion option
- Macrostrat interval links work

## [1.5.3] - 2025-07-31

Broke apart info panel into 5 components

- Regional Stratigraphy
- Physiography
- Macrostrat Linked Data
- xDD Info
- Fossils

## [1.5.2] - 2025-07-23

Map panel supports fossils clicks now

## [1.5.1] - 2025-07-16

InfoDrawer exported correctly

## [1.5.0] - 2025-07-14

Added InfoDrawer component

Need to

- integrate fossils

## [1.4.0] - 2025-07-02

- Allow `DevMapPage` to set more options for the map, inherited from Mapbox GL
  map options
- Streamline map position management during initialization
- Fix stuck loading spinner at map initialization
- Add new stories for position management
- Make `enableTerrain: false` work correctly
- Improve options for map view styling, by allowing the `className` to be set
  and deprecating the auto setting of `#map` ID on the map view.

## [1.3.2] - 2025-06-26

Bugfix for DevMapPage when applying custom styles

## [1.3.1] - 2025-06-25

Small improvements to types and styles

## [1.3.0] - 2025-04-09

- Improve types for latitude and longitude
- Add `useBasicMapStyle` hook and supporting `getBasicMapStyle` function
- Improve initialization logic to avoid rendering before the map is ready. We
  fall back to timeouts because Mapbox GL events aren't called consistently
- Add a `standalone` option for map rendering
- Add internal support for `overlayStyles`, which are added after the basic map
  style is loaded, and `transformStyle`, which can adjust the style after load

## [1.2.4] - 2025-03-08

Fix some small styling errors

## [1.2.3] - 2025-02-23

- Allow map interface to be rendered without a context panel
- Create a story for streamlining style reloading with 3D terrain
- Move all terrain management to `@macrostrat/mapbox-react`
- New approach to setting up map styles that reduces the chance of full
  re-renders of terrain layers. This enables smoother transitions between
  minimally varying map styles.

## [1.2.2] - 2025-02-16

- Improve styles for map sidebar and expansion panels
- Add several new CSS variables

## [1.2.1] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [1.2.0] - 2025-02-14

- Make several dependencies more explicit
- Create an option for the sidebar to focus on a region as well as a point
- Streamline code
- Create stories

## [1.1.0] - 2024-11-16

- Improve map state management with `zustand` (in `@macrostrat/mapbox-react`)
- Add `styleType` prop to `DevMapPage` component to allow setting "standard"
  Mapbox styles or "macrostrat" styles (the default)

## [1.0.12] - 2024-11-13

- Add a `bounds` option to the `DevMapPage` component

## [1.0.11] - 2024-11-07

- Fix bundling again

## [1.0.10] - 2024-11-05

- Add documentation and examples of map easing
- Improve floating navigation
- Improve map padding management component
- Improve styles

## [1.0.8] - 2024-10-26

- Fix inspector colors with new version of `chroma-js`
- Introduce dependency on `@macrostrat/color-utils`

## [1.0.5] - 2024-10-24

- Fix bundling

## [1.0.4] - 2024-10-24

- Fix bad build instructions

## [1.0.3] - 2024-10-24

- Add package specifier for types

## [1.0.2] - 2024-10-24

- Update `axios` version
- Fix dependency versions

## [1.0.1] - 2024-10-02

- Bug fix: missing package specifier

## [1.0.0] - 2024-10-02

Updated to use BlueprintJS 5.0
