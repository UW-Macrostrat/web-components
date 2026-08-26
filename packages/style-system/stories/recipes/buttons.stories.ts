import { Meta } from "@storybook/react-vite";
import classNames from "classnames";
import h from "./buttons.module.sass";

// A button styled entirely from --pz-* tokens. Toggle Storybook dark mode to
// confirm fills stay legible (text-on-fill) and hover/focus adapt.

function Button({ variant, disabled, children }) {
  return h("button.button", { className: classNames(variant), disabled }, children);
}

function Buttons() {
  return h("div.frame", [
    h("div.row", [
      h(Button, { variant: "primary", children: "Brand" }),
      h(Button, { variant: "intent-primary", children: "Primary" }),
      h(Button, { variant: "success", children: "Success" }),
      h(Button, { variant: "warning", children: "Warning" }),
      h(Button, { variant: "danger", children: "Danger" }),
    ]),
    h("div.row", [
      h(Button, { variant: "minimal", children: "Minimal" }),
      h(Button, { variant: "outline", children: "Outline" }),
      h(Button, { variant: "primary", disabled: true, children: "Disabled" }),
    ]),
  ]);
}

export default {
  title: "Style system/Recipes/Buttons",
  component: Buttons,
} as Meta<typeof Buttons>;

export const Default = { args: {} };
