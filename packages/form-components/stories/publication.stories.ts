import h from "@macrostrat/hyper";

import { Publication } from "../src";
import "./global.scss";
import { StoryFn, Meta } from "@storybook/react-vite";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Publication",
  component: Publication,
} as Meta<typeof Publication>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Publication> = (args) =>
  h(Publication, { ...args });

export const HelloWorld = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
HelloWorld.args = {
  title: "Hello world!",
  doi: "jkorek/134-1021",
};
