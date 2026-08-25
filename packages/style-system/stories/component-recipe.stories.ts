import { Meta } from "@storybook/react-vite";
import classNames from "classnames";
import h from "./component-recipe.module.sass";

// How a component links to the Paleozoic globals. Each card consumes `--pz-*`
// semantic tokens; the card also exposes its own weak-named `--card-accent`
// whose default is a `--pz-` token. See component-recipe.module.sass for the
// three variants:
//   - default  → tracks --pz-accent-color
//   - secondary → re-pointed to --pz-accent-secondary-color (another global)
//   - custom   → escape-hatch literal, globals untouched
//
// Toggle Storybook dark mode to confirm all three follow the global .bp6-dark
// overrides for free.

function Card({ variant, title, body }) {
  return h("div.card", { className: classNames(variant) }, [
    h("h3.title", title),
    h("p.body", body),
  ]);
}

function Recipe() {
  return h("div.stack", [
    h(Card, {
      title: "Default card",
      body: "--card-accent defaults to --pz-accent-color (purple). Change the global and this tracks it.",
    }),
    h(Card, {
      variant: "secondary",
      title: "Secondary card",
      body: "--card-accent re-pointed to --pz-accent-secondary-color (mint) — still fully themed.",
    }),
    h(Card, {
      variant: "custom",
      title: "Custom card",
      body: "--card-accent set to a one-off literal (escape hatch). The global contract is untouched.",
    }),
  ]);
}

export default {
  title: "Style system/Component recipe",
  component: Recipe,
} as Meta<typeof Recipe>;

export const GlobalToComponent = { args: {} };
