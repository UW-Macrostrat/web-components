# Macrostrat/Web-Components

Web-Components is a [React](https://reactjs.org/) based user interface ecosystem designed for
efficiently developing data-dense web-frontends. Foundationally built upon other UI-Libraries, heavily
upon [@blueprintjs](https://github.com/palantir/blueprint), the components herein are meant to be easily implemented with much of the business logic encapsulated within the library itself.

## Architecture

#### Libraries

Web-Components is a monorepo that holds several libraries in the `/packages` directory. All of the libraries with this directory are constantly being updated and added to. However, stable versions of them can be found on the NPM registry:

- [`@macrostrat/ui-components`](https://www.npmjs.com/package/@macrostrat/ui-components)
- [`@macrostrat/form-components`](https://www.npmjs.com/package/@macrostrat/form-components)
- [`@macrostrat/data-components`](https://www.npmjs.com/package/@macrostrat/data-components)
- [`@macrostrat/column-components`]

#### Apps

Web-Components also holds a collection of web-applications that use the component libraries discussed above. These apps can be found in the `/apps` directory.

## Storybook

The libraries within Web-Components use [Storybook](https://storybook.js.org/) for development and collaboration. There is one main storybook at the root of the monorepo and each library has individual `stories` that are gathered at storybook runtime.

## For Developers

To get started developing Web-Components, clone this repository to your machine and run:

```
git submodule init --recursive
```

This will automatically initialize all git submodules used in the monorepo.

Next install all necessary modules. The repository is set up to use **Yarn v2** by default, for
quick installs and updates.

```
npm install
```

To build and view the story book you can run:

```
npm run build-storybook
npm run storybook
```

The storybook will start at port `6006`
