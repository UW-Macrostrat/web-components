import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

import { AuthorList, AuthorListProps } from "./author-list";

const names = [
  "Casey Idzikowski",
  "Daven Quinn",
  "Superman",
  "Batman",
  "Ironman",
  "Spiderman",
];

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "UI components/Author list",
  component: AuthorList,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof AuthorList>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof AuthorList> = (args) =>
  h(AuthorList, { ...args });

export const NameList = Template.bind({});
NameList.args = {
  names,
};

export const WithHighlight = Template.bind({});
WithHighlight.args = {
  names,
  highlight: "Batman",
  limit: null,
};
