# Macrostrat style system

Macrostrat's style system provides colors, typography, and CSS variables for use
in constructing Macrostrat applications. We hope to eventually make this a
logical, consistent, and lightweight system that can be easily pulled in to
support the styling of other modules.

## Bornite

**Bornite** is Macrostrat's design-token system. Tokens are CSS custom
properties prefixed `--bn-`, arranged in layers:

- **Primitives** (`src/bornite/_primitives.scss`) — raw, role-agnostic scales:
  the neutral ramp, the copper brand accent, spacing, radii, and type. Rarely
  consumed directly.
- **Semantic** (`src/bornite/_semantic.scss`) — role-based tokens components
  actually use (`--bn-text-color`, `--bn-panel-background-color`, …), each
  referencing a primitive. Light values in `:root`; dark overrides under
  `.bp6-dark`.
- **Brand overrides** — supplied downstream. The `:root` semantic tokens are the
  intended override surface: a brand (the Macrostrat website, Rockd, Mapboard)
  ships its own `--bn-*` block to re-skin without forking components.

The layer is **additive** — it currently ships alongside the legacy unprefixed
variables and does not replace them yet. Migration of legacy names onto `--bn-`
aliases is tracked in the "Web design system" feature area.

### Applying tokens into designs

- **Component-scoped** — `@use` the text-style mixins in a component's SCSS
  module: `@use "@macrostrat/style-system/src/bornite/typography" as bn;
  .heading { @include bn.heading; }`.
- **Opt-in global** — wrap a free-flowing content region in `.bn-prose` for
  paragraph skips, heading rhythm, links, and code. This overlay is deliberately
  **scoped, not a global bare-element reset** — a global reset would fight
  Blueprint and risk regressing polished pages.

### Blueprint alignment

Many components reference `@blueprintjs` tokens directly, so Bornite's text,
surface, divider, intent, and elevation tokens are **deliberately aligned** to
Blueprint core SCSS variables. Alignments are marked inline with `⌁ bp:$pt-…` in
`src/bornite/*.scss`. Key mappings:

| Bornite token | Blueprint variable |
| --- | --- |
| `--bn-text-color` / `-subtle` / `-disabled` | `$pt-text-color` / `-muted` / `-disabled` |
| `--bn-background-color` | `$pt-app-background-color` |
| `--bn-border-color` / `-muted` | `$pt-divider-black` / `-muted` |
| `--bn-intent-{primary,success,warning,danger}` | `$pt-intent-{primary,success,warning,danger}` |
| `--bn-elevation-{1,2}` | `$pt-elevation-shadow-{1,2}` (dark: `$pt-dark-…`) |

This is "progressive enhancement": aligning now keeps `bp6-*` styling coherent
during migration, and centralizing the references means we can later **override**
Blueprint from one place if we choose to diverge.

Explore and iterate in Storybook (`yarn run dev`): **Style system → Bornite
tokens** (palette + scales + intents), **Component recipe** (global→component
sync), **Typography** (prose overlay + mixins). Storybook resolves this package
from source, so edits to `src/bornite/*` render immediately; toggle dark mode to
exercise the `.bp6-dark` affordances.
