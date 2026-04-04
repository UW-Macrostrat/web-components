This is a monorepo for Macrostrat's user interface modules.

## General architecture

- Modules are bundled with Vite in library mode.
- Packages are published to npm.
- Changelogs are managed with
  [`changesets`](https://github.com/changesets/changesets).
- There aren't any UI tests yet.

## Component building approach

- We use `hyperscript` to generate HTML elements, rather than JSX, as the syntax
  is cleaner.
- We use CSS modules to scope styles.
