import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";

import { AuthorList, AuthorListProps } from ".";

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
  title: "Example/AuthorList",
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

export const WithHighligh = Template.bind({});
WithHighligh.args = {
  names,
  highlight: "Batman",
};
