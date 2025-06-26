# Macrostrat web components

Web-Components is a [React](https://reactjs.org/) based user interface ecosystem
designed for efficiently developing data-dense web-frontends. Foundationally
built upon other UI-Libraries, heavily upon
[@blueprintjs](https://github.com/palantir/blueprint), the components herein are
meant to be easily implemented with much of the business logic encapsulated
within the library itself.

## Architecture

#### Libraries

Macrostrat's web components system is a workbench for producing user interface
components. It is structured as a monorepo, with several modules (in the
`packages` directory) that are being maintained for publication to NPM and
referencing in Macrostrat's user-facing applications. Open-source contributions
and third-party usage are welcome!

Several of the most important modules are:

- [`@macrostrat/ui-components`](https://www.npmjs.com/package/@macrostrat/ui-components)
- [`@macrostrat/form-components`](https://www.npmjs.com/package/@macrostrat/form-components)
- [`@macrostrat/data-components`](https://www.npmjs.com/package/@macrostrat/data-components)
- [`@macrostrat/column-components`](https://www.npmjs.com/package/@macrostrat/column-components)

## Contributing to web components

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
