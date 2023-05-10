import h from "@macrostrat/hyper";

import { FocusStyleManager } from "@blueprintjs/core";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ThreeColumnLayout } from ".";

FocusStyleManager.onlyShowFocusOnTabs();

function ColoredPanel({ color, children, width = "100%" }) {
  return h(
    "div.colored-panel",
    {
      style: { backgroundColor: color, width, height: "100%" },
    },
    children
  );
}

export default {
  title: "Layout/Three-column user interface",
  component: ThreeColumnLayout,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {
    contextPanel: h(ColoredPanel, { color: "dodgerblue", width: 300 }),
    children: h("div.main", [h("div", "Hello, world!")]),
    detailPanel: h(ColoredPanel, { color: "goldenrod", width: 300 }),
    footer: null,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      inlineStories: false,
      // This is stupid tuning, I'm not sure why it's necessary
      iframeHeight: 345,
    },
  },
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => h(ThreeColumnLayout, { ...args });

export const ThreePanelLayout = Template.bind({});

export const WithFooter = Template.bind({
  footer: h("p", null, "This is a really excellent footer"),
});
