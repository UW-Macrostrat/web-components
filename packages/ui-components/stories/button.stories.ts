import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { SaveButton } from "@macrostrat/ui-components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "UI components/Save button",
  component: SaveButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof SaveButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof SaveButton> = (args) =>
  h(SaveButton, args);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};

export const InProgress = Template.bind({});
InProgress.args = {
  inProgress: true,
};
