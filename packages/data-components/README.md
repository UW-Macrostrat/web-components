# Data-Components

A set of frontend React components custom tailored to Macrostrat data and API
endpoints.

Style configuration is currently for SASS, `.scss` but could easily be changed.

Rollup compiles js and types to esm and cjs by default. ESM output is in the
`dist/esm/index.js` while the CJS output is in the `dist/cjs/index.js`. Types
are located at `dist/index.d.ts`.

```
npm install
```

Then any one of the following commands:

```
npm run test // to run the single jest test
npm run storybook // to run the built in storybook
npm run rollup // to run the rollup to view compilied js and types in the dist directory
```
