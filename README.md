# Macrostrat web components

Web-Components is a [React](https://reactjs.org/) based user interface ecosystem
designed for efficiently developing data-dense web-frontends. Foundationally
built upon other UI-Libraries, heavily upon
[@blueprintjs](https://github.com/palantir/blueprint), the components herein are
meant to be easily implemented with much of the business logic encapsulated
within the library itself.

You can view the latest version of each component in the
[storybook](https://dev.macrostrat.org/docs/web-components/?path=/docs/text-extractions-text-extraction--docs)

## Usage

### Libraries

Macrostrat's web components system is a workbench for producing user interface
components. It is structured as a monorepo, with several modules (in the
`packages` directory) that are being maintained for publication to NPM and
referencing in Macrostrat's user-facing applications. Open-source contributions
and third-party usage are welcome!

- [![@macrostrat/api-types](https://img.shields.io/npm/v/@macrostrat/api-types?label=%40macrostrat%2Fapi-types)](https://www.npmjs.com/package/@macrostrat/api-types)
- [![@macrostrat/color-utils](https://img.shields.io/npm/v/@macrostrat/color-utils?label=%40macrostrat%2Fcolor-utils)](https://www.npmjs.com/package/@macrostrat/color-utils)
- [![@macrostrat/column-components](https://img.shields.io/npm/v/@macrostrat/column-components?label=%40macrostrat%2Fcolumn-components)](https://www.npmjs.com/package/@macrostrat/column-components)
- [![@macrostrat/column-views](https://img.shields.io/npm/v/@macrostrat/column-views?label=%40macrostrat%2Fcolumn-views)](https://www.npmjs.com/package/@macrostrat/column-views)
- [![@macrostrat/data-components](https://img.shields.io/npm/v/@macrostrat/data-components?label=%40macrostrat%2Fdata-components)](https://www.npmjs.com/package/@macrostrat/data-components)
- [![@macrostrat/data-sheet](https://img.shields.io/npm/v/@macrostrat/data-sheet?label=%40macrostrat%2Fdata-sheet)](https://www.npmjs.com/package/@macrostrat/data-sheet)
- [![@macrostrat/feedback-components](https://img.shields.io/npm/v/@macrostrat/feedback-components?label=%40macrostrat%2Ffeedback-components)](https://www.npmjs.com/package/@macrostrat/feedback-components)
- [![@macrostrat/form-components](https://img.shields.io/npm/v/@macrostrat/form-components?label=%40macrostrat%2Fform-components)](https://www.npmjs.com/package/@macrostrat/form-components)
- [![@macrostrat/map-interface](https://img.shields.io/npm/v/@macrostrat/map-interface?label=%40macrostrat%2Fmap-interface)](https://www.npmjs.com/package/@macrostrat/map-interface)
- [![@macrostrat/map-styles](https://img.shields.io/npm/v/@macrostrat/map-styles?label=%40macrostrat%2Fmap-styles)](https://www.npmjs.com/package/@macrostrat/map-styles)
- [![@macrostrat/mapbox-react](https://img.shields.io/npm/v/@macrostrat/mapbox-react?label=%40macrostrat%2Fmapbox-react)](https://www.npmjs.com/package/@macrostrat/mapbox-react)
- [![@macrostrat/mapbox-utils](https://img.shields.io/npm/v/@macrostrat/mapbox-utils?label=%40macrostrat%2Fmapbox-utils)](https://www.npmjs.com/package/@macrostrat/mapbox-utils)
- [![@macrostrat/static-map-utils](https://img.shields.io/npm/v/@macrostrat/static-map-utils?label=%40macrostrat%2Fstatic-map-utils)](https://www.npmjs.com/package/@macrostrat/static-map-utils)
- [![@macrostrat/stratigraphy-utils](https://img.shields.io/npm/v/@macrostrat/stratigraphy-utils?label=%40macrostrat%2Fstratigraphy-utils)](https://www.npmjs.com/package/@macrostrat/stratigraphy-utils)
- [![@macrostrat/style-system](https://img.shields.io/npm/v/@macrostrat/style-system?label=%40macrostrat%2Fstyle-system)](https://www.npmjs.com/package/@macrostrat/style-system)
- [![@macrostrat/svg-map-components](https://img.shields.io/npm/v/@macrostrat/svg-map-components?label=%40macrostrat%2Fsvg-map-components)](https://www.npmjs.com/package/@macrostrat/svg-map-components)
- [![@macrostrat/timescale](https://img.shields.io/npm/v/@macrostrat/timescale?label=%40macrostrat%2Ftimescale)](https://www.npmjs.com/package/@macrostrat/timescale)
- [![@macrostrat/ui-components](https://img.shields.io/npm/v/@macrostrat/ui-components?label=%40macrostrat%2Fui-components)](https://www.npmjs.com/package/@macrostrat/ui-components)

### Style imports

Many packages in this monorepo have styles that need to be imported separately
into consuming applications. These styles can be imported into HTML

```html
<link
  rel="stylesheet"
  href="@macrostrat/column-components/dist/column-components.css"
/>
```

or into JavaScript/TypeScript files:

```ts
import "@macrostrat/column-components/dist/column-components.css";
```

For each package, styles can also be imported using a synthetic default import:

```ts
import "@macrostrat/column-components/style.css";
```

The following table lists the packages that require separate style imports,
along with the version since which the style import has been necessary.

| Module                             | Stylesheet                         | Since   |
| ---------------------------------- | ---------------------------------- | ------- |
| `@macrostrat/column-components`    | `.../dist/column-components.css`   | `2.0.0` |
| `@macrostrat/column-creator`       | `.../dist/column-creator.css`      | `0.2.0` |
| `@macrostrat/column-views`         | `.../dist/column-views.css`        | `3.0.0` |
| `@macrostrat/data-components`      | `.../dist/data-components.css`     | `1.0.0` |
| `@macrostrat/data-sheet`           | `.../dist/data-sheet.css`          | `3.0.0` |
| `@macrostrat/feedback-components`  | `.../dist/feedback-components.css` | `2.0.0` |
| `@macrostrat/form-components`      | `.../dist/form-components.css`     | `1.0.0` |
| `@macrostrat/map-interface`        | `.../dist/map-interface.css`       | `2.0.0` |
| `@macrostrat/static-map-utils`     | `.../dist/static-map-utils.css`    | `2.0.0` |
| `@macrostrat/timescale`            | `.../dist/timescale.css`           | `3.0.0` |
| `@macrostrat/ui-components`        | `.../dist/ui-components.css`       | `5.0.0` |
| ---------------------------------- | ---------------------------------- | ------- |

## Contributing

### Installation

To get started developing Macrostrat web components, clone this repository to
your machine, install dependencies, and start the storybook begin developing.

Run `yarn install` in the root directory to install dependencies.

#### Package manager

This repository is optimized for [Yarn](https://yarnpkg.com/) v4 or greater and
may not work with NPM or other package managers. Run `corepack enable` to enable
the `yarn` command that is bundled with this repository.

#### Environment variables

In order to make map-based examples work, you will have to set the
`VITE_MAPBOX_API_TOKEN` environment variable to a valid Mapbox token. You can do
this by creating a `.env` file in the root of the repository.

### Developing components

#### The Storybook component workbench

We use [Storybook](https://storybook.js.org/) for developing components in an
isolated environment. To start the storybook, run `yarn run dev` in the root
directory. The storybook will start at port `6006`. You can then create new
'stories' referencing components to create standalone views.

When you make a change to a component, it is crucial to make sure that the
examples in the Storybook continue to work. If you have to update existing
stories, it is likely you will need to update API documentation and Changelog to
reflect the breaking change.

#### Changelog

If you make a change to a component, you should update the changelog for the
containing package (the `CHANGELOG.md` file in the package directory).
Unreleased changes can be described in an `Unreleased` section at the top of the
changelog. Upon publishing the package, the full changelog will be compiled from
the `Unreleased` section and any prerelease changes.

#### Developing components in a consuming application

Sometimes, it can be useful to prototype components as you are developing a
consuming application. To do this, you can use `yarn link` (or an equivalent
command in your package manager) to link the packages in this monorepo to your
application.

For instance, if you were working on the
[Macrostrat web](https://github.com/UW-Macrostrat/web) repository, you could run
the following commands:

```sh
# In the `web` directory with a `web-components` directory at the same level
yarn link -A -r ../web-components
# Creates relative links to the packages in the `web-components` directory
```

This will link the packages in the `web-components` directory to the `web`
application using the ["portal" protocol](https://yarnpkg.com/protocol/portal).

The `package.json` `resolutions` entries created by this linking process should
be removed before publishing the application, as they will prevent the
application from being compiled correctly in CI or a new environment.

### Publishing packages

This monorepo has a continuous integration pipeline that helps with publishing
packages. You'll need to create a Pull Request to `main` with your changes run
the following steps:

1. Ensure that all modules build correctly.
2. **Update package versions**: Update the `package.json` files in each package
   that you want to publish.
3. **Update changelogs**: Update the `CHANGELOG.md` files in each package to
   reflect the changes made since the last release.

The PR checks will not pass until all these steps are completed for each package
with an updated version. Once all checks pass, the PR can be merged into `main`.
The CI pipeline will then automatically publish the updated packages to NPM,
using the versions specified in the `package.json` files. Releases will be
tagged.

It is possible to merge PRs that do not publish to NPM, by simply not updating
the package version.

#### Local helpers for publishing

- Run `yarn run status` to view a change list for each potential package to be
  published. This will allow you to update `package.json` versions and changelog
  entries.
- If desired, you can run `yarn run prepare` to try building the packages.
- If the build is successful, you can run `yarn run publish` to publish new
  versions.
- Other workspace-management tools, such as `yarn version check`, can also be
  helpful for version management

You will need the NPM organizational credentials (to the `@macrostrat`
organization) to publish packages.

#### Other useful commands

- Check types: `yarn run check`
- Build all packages locally: `yarn run build`
- Check how a package is consumed: `yarn why <package-name>`
- General information about packages and dependencies:
  `yarn info -A -R <package-name>`

### Maintenance

#### Upgrading storybook

```

yarn dlx storybook@latest upgrade

```

#### Upgrading dependencies

It can be useful to upgrade a specific dependency to its latest version:

```

yarn up -i <package-name>

```

#### Maintaining references

```sh
yarn why @macrostrat/column-components
```

#### Find circular dependencies

Circular dependencies prevent building and Vite compilation in some cases

```sh
yarn dlx madge --circular --extensions ts packages/column-views
```
