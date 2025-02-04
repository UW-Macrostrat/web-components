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

### Package manager

This repository is optimized for [Yarn](https://yarnpkg.com/) v4 or greater and
may not work with NPM or other package managers.

### Environment variables

In order to make map-based examples work, you will have to set the
`VITE_MAPBOX_API_TOKEN` environment variable to a valid Mapbox token. You can do
this by creating a `.env` file in the root of the repository.

### Developing components with storybook

We use [Storybook](https://storybook.js.org/) for developing components in an
isolated environment. To start the storybook, run `yarn run dev` in the root
directory. The storybook will start at port `6006`

### Publishing packages

This monorepo has a custom script that helps with publishing packages.

- Run `yarn run status` to view a change list for each potential package to be
  published. This will allow you to update `package.json` versions and changelog
  entries.
- If desired, you can run `yarn run prepare` to try building the packages.
- If the build is successful, you can run `yarn run publish` to publish new
  versions.

You will need the NPM organizational credentials (to the `@macrostrat`
organization) to publish packages.

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
