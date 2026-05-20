# Changelog

## [1.0.9] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/form-components-v1.0.8...@macrostrat/form-components-v1.0.9)

### Patch Changes

- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
  - @macrostrat/ui-components@5.0.10

## [1.0.8] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/form-components-v1.0.7...@macrostrat/form-components-v1.0.8)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
  - @macrostrat/ui-components@5.0.9
  - @macrostrat/color-utils@1.2.2

## [1.0.7] - 2026-05-07 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/form-components-v1.0.6...@macrostrat/form-components-v1.0.7)

### Patch Changes

- Update @types/react
  [64d04951](https://github.com/UW-Macrostrat/web-components/commit/64d04951e8b63f05f9325a0e13817164d1813df7)
- Updated dependencies
  [64d04951](https://github.com/UW-Macrostrat/web-components/commit/64d04951e8b63f05f9325a0e13817164d1813df7)
  - @macrostrat/ui-components@5.0.8

## [1.0.6] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/form-components-v1.0.5...@macrostrat/form-components-v1.0.6)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/ui-components@5.0.7

## [1.0.5] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/form-components-v1.0.4...@macrostrat/form-components-v1.0.5)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/ui-components@5.0.6

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
