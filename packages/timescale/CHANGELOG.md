# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0]- 2026-02-07

- Improve handling of arbitrary timescales from the Macrostrat API
- Improve interval and age click handling, returning `{interval, age}` as data
  instead of just `interval`
- Improve styling logic internally, switch from SCSS to SASS, and streamline CSS
  module imports
- Add a new `rotateLabels` prop to control label rotation
- Improve UI component stories

## [3.0.1] - 2026-01-29

- Change layout of `package.json`

## [3.0.0] - 2026-01-26

- Change bundling process to use `@macrostrat/web-components-bundler`
- Update peer dependencies to React 18
- Require styles to be imported separately as `@macrostrat/timescale/styles.css`
  or `@macrostrat/timescale/dist/tiless

## [2.3.2] - 2025-12-19

Fix typescript errors

## [2.3.1] - 2025-12-11

Fix coloring using `intervalStyle` prop, which was mistakenly overridden in the
last update.

## [2.3.0] - 2025-11-28

- Allow label positioning to be more discretely controlled (e.g., turn off label
  rotation)
- Add a `fetchMacrostratIntervals` and `buildIntervalsTree` function to get
  timescale data from the Macrostrat API (only international intervals supported
  for now)
- Remove circular imports

## [2.2.2] - 2025-10-29

- Add the ability to specify your own scale for the timescale
- Add a function prop to allow custom rendering of interval labels

## [2.2.1] - 2025-07-01

Timescale default intervals include macrostrat `int_id`

## [2.2.0] - 2025-06-01

Timescale now clickable, returns event and interval clicked

## [2.1.1] - 2025-02-15

Add a `node` target to bundle without imported CSS.

## [2.1.0] - 2025-02-14

- Major update to the timescale component
- Improved typings and styling somewheat
- Shifted to CSS modules and SCSS for styling
- Moved `SizeAwareLabel` function to `@macrostrat/ui-components` package to
  avoid circular dependency with `@macrostrat/column-components`
- Removed unnecessary boilerplate for standalone repository

## [1.0.0] - 2020-08-26

- Initial version
- Basic geologic timescale rendering
- Vertical and horizontal timescales
- Absolute time and flexible (label-driven) widths
