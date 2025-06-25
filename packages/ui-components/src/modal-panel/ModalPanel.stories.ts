import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

import { ModalPanel } from ".";

export default {
  title: "UI components/Modal panel",
  component: ModalPanel,
  args: {
    onClose: () => console.log("Close Action Triggered"),
    title: "Base Modal Panel",
    headerChildren: h("div", ["Header Child"]),
    children: h("div", [
      h("div", ["Panel Child One"]),
      h("div", ["Panel Child Two"]),
      h("div", ["Panel Child Three"]),
    ]),
  },
} as ComponentMeta<typeof ModalPanel>;

const Template: ComponentStory<typeof ModalPanel> = (args) =>
  h(ModalPanel, { ...args });

export const BasePanel = Template.bind({});
BasePanel.args = {};

export const MinimalPanel = Template.bind({});
MinimalPanel.args = { minimal: true };
