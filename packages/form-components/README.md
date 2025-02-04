# Macrostrat/form-components

A set of reusable react components for forms and data entry.

This includes authentication and user-management components extracted from
Sparrow.

Rollup compiles js and types to esm and cjs by default. ESM output is in the
`dist/esm/index.js` while the CJS output is in the `dist/cjs/index.js`. Types
are located at `dist/index.d.ts`.

To run clone the repository and run:

```
npm install
```

Then any one of the following commands:

```
npm run test // to run the single jest test
npm run storybook // to run the built in storybook
npm run rollup // to run the rollup to view compilied js and types in the dist directory
```
