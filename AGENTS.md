# AI Agent Guide for Macrostrat Web Components

## Project Overview

This is a **Yarn v4 monorepo** publishing 20+ React component packages for
geologic data visualization. Components are built with Vite in library mode and
published to NPM under `@macrostrat/*`. Uses **hyperscript** (not JSX) with CSS
modules for styling.

## Critical Setup

```bash
corepack enable              # Enable Yarn v4
yarn install                 # Install dependencies
yarn run dev                 # Start Storybook on port 6006
```

Environment: Create `.env` with `VITE_MAPBOX_API_TOKEN` for map examples.

## Key Architecture Patterns

### Hyperscript, Not JSX

Components use `@macrostrat/hyper` for element creation:

```typescript
import h from "@macrostrat/hyper";
// Not JSX: <div className="container">...</div>
// Instead: h("div.container", [...])
```

With CSS modules via `vite-plugin-hyperstyles`:

```typescript
import h from "./main.module.scss";  // Auto-styled hyperscript
h("div.container", [...])            // Classes auto-scoped
```

See `packages/column-components/src/hyper.ts` for pattern. Styled variant:
`hyperStyled(styles)`.

We follow the "headline" rule for function ordering in files: the top-level or
most important functions in the file should be near the top, with utility
methods at the bottom.

### Workspace Dependencies

Use `workspace:^` protocol for inter-package dependencies:

```json
"dependencies": {
  "@macrostrat/ui-components": "workspace:^"
}
```

Never use `workspace:*` for published packages (only for dev bundler).

### Package Structure

Standard layout:

```
packages/<package-name>/
  src/index.ts          # Entry point
  dist/                 # Build output (gitignored)
  package.json          # Must define "source", "main", "module", "types", "exports"
  CHANGELOG.md          # Required for publishing
  stories/              # Storybook examples (optional)
```

### Build System

All packages build via `bundle-library` command from `toolchain/bundler`:

```json
"scripts": { "build": "bundle-library ." }
```

Output: ES modules (`dist/index.js`) + CJS (`dist/index.cjs`) + types
(`dist/index.d.ts`) + CSS (`dist/<package-name>.css`).

Custom builds: Add `vite.config.ts` in package root to override.

### Style Bundling

- CSS modules: `*.module.{scss,sass,css}` (scoped classes)
- Global styles bundled to `dist/<package-name>.css`
- Consumers must import styles separately:
  `import "@macrostrat/<package>/style.css"`
- Vite plugin `vite-plugin-hyperstyles` enables direct CSS module imports as
  hyperscript

### Rollup Internalization

Some dependencies must be bundled (not external). In `package.json`:

```json
"rollupInternal": ["labella", "ui-box"]
```

Used for packages with CJS/ESM issues.

## Publishing Workflow

Uses `changesets` CLI for version management:

1. **Make changes**, run `yarn run changeset` to create changeset
2. **Prepare release**: `yarn run update-versions` (updates versions +
   changelogs)
3. **Verify**: Check `package.json` versions and `CHANGELOG.md` entries
4. **Build locally**: `yarn run prepare` or `yarn run build`
5. **Publish**: CI auto-publishes on merge to `main` if versions changed

Manual: `yarn run publish` (requires NPM org credentials)

**PR Requirements**: Updated `package.json` version AND `CHANGELOG.md` entry for
each changed package.

## Storybook Development

Stories located in:

- `packages/*/stories/*.stories.{ts,tsx}` (per-package)
- `stories/*.stories.ts` (monorepo-level)

Story format (CSF3):

```typescript
import { Meta } from "@storybook/react-vite";
export default { title: "Package/Component", component: MyComponent } as Meta;
export const Default = { args: { prop: "value" } };
```

Storybook config: `.storybook/main.ts` uses `vite-plugin-hyperstyles` and
`resolve.conditions: ["source"]` to prioritize source over dist.

## Common Commands

```bash
yarn run dev                    # Storybook dev server
yarn run build                  # Build all packages
yarn run status                 # Check publishable packages
yarn run prepare                # Build packages for publishing
yarn run publish                # Publish changed packages to NPM
yarn run check-types            # TypeScript validation
yarn run check-circular         # Find circular dependencies
yarn why <package-name>         # Analyze package consumption
yarn dlx madge --circular --extensions ts <path>  # Circular deps in path
```

## TypeScript Configuration

- Base: `tsconfig.base.json` (moduleResolution: "bundler", types includes
  vite-plugin-hyperstyles)
- Package builds: Use root `tsconfig.base.json`
- Global types: `global.d.ts` in root

## Troubleshooting Patterns

**Build fails with module resolution errors**: Check `workspace:^` dependencies,
ensure source exports defined in `package.json`.

**Styles not applying**: Import stylesheet separately:
`import "@macrostrat/<package>/style.css"` (see README table).

**Circular dependencies**: Use `madge` to detect, often caused by barrel exports
in `index.ts`. Break into separate files.

**Storybook not showing package changes**: Storybook uses source via
`conditions: ["source"]`. Ensure `package.json` exports include
`"source": "./src/index.ts"`.

**Module not found in consuming app**: Check package `exports` field defines all
entry points, especially `"."` and `"./style.css"`.

## Package Categories

- **Core UI**: `ui-components` (Blueprint.js wrappers), `style-system` (base
  styles)
- **Columns**: `column-components`, `column-views`, `column-creator`
  (stratigraphic columns)
- **Maps**: `map-interface`, `mapbox-react`, `mapbox-utils`, `map-styles`,
  `svg-map-components`
- **Data**: `data-provider`, `data-components`, `data-sheet` (API integration,
  tables)
- **Utils**: `color-utils`, `stratigraphy-utils`, `timescale`, `api-types`
- **Tooling**: `toolchain/bundler`, `toolchain/vite-plugin-hyperstyles`

Most packages depend on `@macrostrat/hyper` (external) and `@blueprintjs/core`
(peer).
