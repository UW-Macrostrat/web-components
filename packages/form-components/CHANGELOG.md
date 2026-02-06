# Changelog

## [1.0.4] - 2026-02-06

Upgraded dependencies, especially `mapbox-gl` to v3.

## [1.0.3] - 2026-01-29

- Change layout of `package.json`

## [1.0.2] - 2026-01-28

Add rollup interop to fix CommonJS dependency linking issues

## [1.0.1] - 2026-01-28

- Fix CommonJS dependency linking issues
- Add `ui-box` dependency

## [1.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Update bundling process to `@macrostrat/web-components-bundler`
- Make CSS imports optional; users must now import
  `@macrostrat/form-components/style.css` or
  `@macrostrat/form-components/dist/form-components.css` for styles

## [0.2.5] - 2025-11-28

- Upgrade `parcel` bundler

## [0.2.4] - 2025-08-08

Add LexSelection component

## [0.2.2] - 2025-06-25

Improve styles and types

## [0.2.1] - 2025-02-22

- `ItemSelect` component: add option to not fill width, and add active highlight

## [0.2.0] - 2025-02-20

- Add `ItemSelect` component for general selections (items must have a `name`
  property)
- Add `ActionPreflight` component for staging actions that require configuration
  and confirmation
- Add appropriate stories for new components

## [0.1.2] - 2025-02-15

Added `files` specifier to `package.json` to ensure that all `dist` files are
included in the package.

## [0.1.1] - 2025-02-15

Addd a `node` target to bundle without imported CSS.

## [0.1.0] - 2025-02-14

- Added authentication components to the initial form components from Sparrow
- Improved publication search and select components

## [0.0.5] - 2022-04-28

First components we want included in first batch.

- Create-user and login forms: with validation
- Publication search and select from Sparrow
- Long/Latitude select on Map
- Evolved version of ModelEditorContext?
