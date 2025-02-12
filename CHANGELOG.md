# Changelog

# `[3.0.0]` - 2024-02-04

This release includes major changes in support of bundling all dependencies for
a more standalone workflow. We intend to remove the dependency of the
[Macrostrat web](https://github.com/UW-Macrostrat/web) repository on this
monorepo.

- Removed modules that are not ready for bundling, including some (e.g.,
  `common` and `concept-app-helpers`) that were not intended for deployment as
  standalone packages
- Remove [geologic patterns](https://github.com/davenquinn/geologic-patterns)
  submodule in favor of a NPM package dependency
- Merge several modules into the `@macrostrat/column-views` and
  `@macrostrat/stratigraphy-utils` packages
- Merge `@macrostrat/auth-components` into `@macrostrat/form-components`
- Remove some legacy stylus styles
- Rename `@macrostrat/map-components` to `@macrostrat/svg-map-components` to
  avoid confusion with more general-purpose map components
- Rename `@macrostrat/mapbox-styles` to `@macrostrat/map-styles`

# `[2.0.0]` - 2023-04-16

- Internalized all modules in the monorepo, instead of referencing as
  submodules.
- Upgraded to Storybook 7.0.5
- Removed Stylus in favor of SCSS in all modules
