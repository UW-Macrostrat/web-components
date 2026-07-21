import { Meta } from "@storybook/react-vite";
import h from "./callouts.module.sass";

function Callout({ variant, title, body }) {
  const className = variant ? `callout ${variant}` : "callout";
  return h(`div.${className.split(" ").join(".")}`, [
    h("h4.title", title),
    h("p.body", body),
  ]);
}

function Callouts() {
  return h("div.frame", [
    h(Callout, {
      variant: "primary",
      title: "Heads up",
      body: "This column has unreviewed age constraints.",
    }),
    h(Callout, {
      variant: "success",
      title: "Saved",
      body: "Your changes to the section were published.",
    }),
    h(Callout, {
      variant: "warning",
      title: "Check overlap",
      body: "Two units share a boundary age — verify the contact.",
    }),
    h(Callout, {
      variant: "danger",
      title: "Validation failed",
      body: "Age must increase downward within a column.",
    }),
  ]);
}

export default {
  title: "Style system/Recipes/Callouts",
  component: Callouts,
} as Meta<typeof Callouts>;

export const Default = { args: {} };
