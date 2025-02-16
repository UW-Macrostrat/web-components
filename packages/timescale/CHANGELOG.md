# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
