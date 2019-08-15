# Macrostrat UI Components

A library of common UI components implemented with React, for use in basic
applications for UW-Macrostrat.

## Installing

```
> npm install --save @macrostrat/ui-components
```

## Requiring bundled code

These UI components are written in [Coffeescript](https://coffeescript.org/),
and styles are generally written in [Stylus](http://stylus-lang.com/).
However, new components can be added using Javascript, JSX and CSS.
Everything is bundled to ES6 Javascript for use in other applications
using [Rollup](https://rollupjs.org/guide/en/), [Babel](https://babeljs.io/), and a fleet of plugins.

The packaging step is fragile and the configuration is fraught at best (see e.g. [issue #1](https://github.com/UW-Macrostrat/ui-components/issues/1)) – however, this
approach allows the components to be imported into an application
that is collected with, e.g., [Webpack](https://webpack.js.org/) or
[Parcel](https://parceljs.org/), without any special configuration.
This is important for wide reuse: bundler configurations and accepted file types
vary, most ignore code in `node_modules`, and common boilerplates such as
[create-react-app](https://create-react-app.dev/) do not support Coffeescript compilation.

Because CSS is stripped during packaging, we must import it separately. Several
CSS files from the BlueprintJS project are required for this library to function.
These can be imported directly into HTML (an exercise left to the developer) or
included in Javascript for further processing by a bundler:
```js
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@macrostrat/ui-components/lib/index.css'
```

We also provide [`init.js`](init.js), a small helper that imports these styles
and sets up common Babel and BlueprintJS configuration.

## Todo

- [ ] Come to a decision regarding whether BlueprintJS libraries should be
      `dependencies` or `peerDependencies`.
- [ ] Use less aggressive transpilation for ES6 modules, if appropriate.
- [ ] Bundle ES6 modules as separate files to improve code-splitting
      and allow direct importing of individual components when
      aggressive bundle-size optimization is needed.

## Credits

This library is primarily maintained by [Daven Quinn](https://davenquinn.com),
who mostly wants to look at rocks but has to solve Javascript preprocessor issues
instead.
