# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2025-12-13

Small fixes to note components

## [1.4.0] - 2025-12-10

- Major update to `Note` and note-related components
- Add a `FocusableNoteColumn` mode based on the `EditableNoteColumn` component
- Removed outdated note-related styles and simplified CSS scopes

## [1.3.1] - 2025-11-28

- Update axis components
- Improve handling on nonlinear and discontinuous axes

## [1.3.0] - 2025-10-29

- Switch to `@visx/axis` for axis rendering
- Remove `SymbolColumn` component
- Simplify many components
- Improve surface generation

## [1.2.0] - 2025-06-25

Major improvement and modernization for `Note` component for section-aligned
content.

## [1.1.0] - 2025-04-09

- Improve configurability of `AgeAxis` component
- Add an `ORDINAL` option to the `ColumnAxisType` enum
- Standardize generation of UUIDs to help with server rendering
- Improve `ClippingFrame` component to allow clipping to be turned off, and to
  allow different clipping shapes
- Improve Typescript types
- Switch many components from class-based to functional
- Remove some instances of `findDOMNode`

## [1.0.3] - 2025-02-16

Improve age axis styles

## [1.0.2] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [1.0.1] - 2025-02-14

- Update d3 dependencies to
  [v6](https://observablehq.com/@d3/d3v6-migration-guide)
- Remove `prop-types` dependency

## [1.0.0] - 2025-02-14

- First full release of the `@macrostrat/column-components` library
- Improve Typescript coverage
- Add storybook examples
- Modernize some React components

## [1.0.0-dev2] - 2024-10-02

- Fix package specifiers

## [1.0.0-dev1] - 2024-10-02

Initial testing release of the `@macrostrat/column-components` library for NPM

- Integrates some changes from the Naukluft app
- Move some primitives from the Naukluft app to the `@macrostrat/ui-components`
  library
