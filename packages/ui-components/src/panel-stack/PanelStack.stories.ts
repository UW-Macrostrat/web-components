import React from "react";
import h from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
//import "./panel.scss";

import { ComponentStory, ComponentMeta } from "@storybook/react";
import { PanelStack } from ".";

function First(props) {
  const openNewPanel = () => {
    props.openPanel({
      props: {},
      renderPanel: Second,
      title: "Second Panel",
    });
  };

  return h("div.panel-content", [
    "First Panel",
    h(Button, { onClick: openNewPanel, intent: "primary" }, [
      "Open Second Panel",
    ]),
  ]);
}
function Second(props) {
  const openNewPanel = () => {
    props.openPanel({
      props: {},
      renderPanel: Third,
      title: "Third Panel",
    });
  };

  return h("div.panel-content", [
    "First Panel",
    h(Button, { onClick: openNewPanel, intent: "success" }, [
      "Open Third Panel",
    ]),
  ]);
}
function Third(props) {
  const openNewPanel = () => {
    props.openPanel({
      props: {},
      renderPanel: First,
      title: "First Panel",
    });
  };

  return h("div.panel-content", [
    "First Panel",
    h(Button, { onClick: openNewPanel, intent: "danger" }, ["Start Over!"]),
  ]);
}

const initialPanel = {
  props: {
    panelNumber: 1,
  },
  renderPanel: First,
  title: "First Panel",
};

export default {
  title: "Example/PanelStack",
  component: PanelStack,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {
    initialPanel,
    className: "stack",
    renderActivePanelOnly: true,
  },
} as ComponentMeta<typeof PanelStack>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PanelStack> = (args) =>
  h(PanelStack, { ...args });

export const PanelStackExample = Template.bind({});
PanelStackExample.args = {};
