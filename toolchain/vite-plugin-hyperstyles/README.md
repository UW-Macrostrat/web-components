# Vite-Plugin-Hyperstyles

A Vite plugin that allows you to easily style your hyperscript using
module-scoped CSS.

## Usage

```css
/* styles.modules.css */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  color: blue;
  font-size: 20px;
}

.description {
  color: gray;
  font-size: 16px;
}
```

```typescript
import h from "./styles.modules.css";

// Class name scopes are applied automatically
const element = h("div.container", [
  h("h1.title", "Hello, World!"),
  h(
    "p.description",
    { className: h.description },
    "This is a styled hyperscript example.",
  ),
]);
```

This replaces the slightly more verbose syntax that can be used without the
plugin:

```typescript
import hyper from "@macrostrat/hyper";
import styles from "./styles.modules.css";

const h = hyper.styled(styles);
...
```

## Configuration

In your `vite.config.ts`, add the plugin:

```typescript
import { defineConfig } from "vite";
import hyperStyles from "@macrostrat/vite-plugin-hyperstyles";

export default defineConfig({
  plugins: [hyperStyles()],
});
```

If you're using Typescript, you'll want to add a type declaration for the
enhanced hyperscript function to your TSConfig

```json
{
  "compilerOptions": {
    // ...
    "types": ["@macrostrat/vite-plugin-hyperstyles/client", "vite/client"]
    // Note: order matters; ensure vite/client comes after this plugin
  }
}
```
