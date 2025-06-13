import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { RockdImage } from "../src";

export default {
  title: "UI components/Rockd Image",
  component: RockdImage,
  argTypes: {
    src: {
      control: "text",
      description: "Source URL of the image",
    },
    className: {
      control: "text",
      description: "CSS class name for styling the image",
    },
    width: {
      control: "number",
      description: "Width of the image in pixels",
    },
    height: {
      control: "number",
      description: "Height of the image in pixels",
    },
  },
} as ComponentMeta<typeof RockdImage>;

const Template: ComponentStory<typeof RockdImage> = (args) =>
  h(RockdImage, args);

export const Primary = Template.bind({});
Primary.args = {
  src: "earth-crust.jpg",
  className: "my-image",
  width: 600,
  height: 400,
};

