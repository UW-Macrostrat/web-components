# Macrostrat UI Components

A library of common UI components implemented with React, for use in basic
applications at the University of Wisconsin [Macrostrat lab](https://macrostrat.org).
You can find the documentation for these components [here](https://dev.macrostrat.org/docs/ui-components).

## Installing

```
> npm install --save @macrostrat/ui-components
```

## Requiring bundled code

These UI components are written in [Typescript](https://typescriptlang.org/),
and styles are generally written in [Stylus](http://stylus-lang.com/).
Everything is bundled to ES6 Javascript for use in other applications
using [Rollup](https://rollupjs.org/guide/en/), [Babel](https://babeljs.io/), and a fleet of plugins.

Because CSS is stripped during packaging, it must be imported separately. Several
CSS files from the BlueprintJS project are also required for this library to function.
These can be imported directly into HTML (an exercise left to the developer) or
included in Javascript for further processing by a bundler:

```js
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@macrostrat/ui-components/lib/esm/index.css";
```

We also provide [`init.js`](init.js), a small helper that imports these styles
and sets up common Babel and BlueprintJS configuration.

## Extensions

Some extensions require additional libraries that may or may not be installed. For
instance, buttons in `@macrostrat/ui-components/lib/esm/

## Todo

- [ ] Come to a decision regarding whether BlueprintJS libraries should be
      `dependencies` or `peerDependencies`.
- [x] Use less aggressive transpilation for ES6 modules, if appropriate.
- [x] Bundle ES6 modules as separate files to improve code-splitting
      and allow direct importing of individual components when
      aggressive bundle-size optimization is needed.

## Credits

This library is primarily maintained by [Daven Quinn](https://davenquinn.com),
who mostly wants to look at rocks but has to solve Javascript preprocessor issues
instead.
