import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SaveButton } from ".";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Example/SaveButton",
  component: SaveButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof SaveButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof SaveButton> = (args) => (
  <SaveButton {...args} />
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};

export const InProgress = Template.bind({});
InProgress.args = {
  inProgress: true,
};
