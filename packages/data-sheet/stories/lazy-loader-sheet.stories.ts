import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./postgrest-sheet.stories.module.sass";
import { TestLazyLoaderTableView } from "../src";

const endpoint = "https://dev.macrostrat.org/api/pg";

function TestLazySheet(props) {
  return h(
    "div.postgrest-sheet-container",
    h(TestLazyLoaderTableView, {
      density: "medium",
    }),
  );
}

const defaultColumnOptions = {
  overrides: {
    name: "Unit name",
    comments: "Comments",
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/Lazy loader sheet",
  component: TestLazySheet,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {
    columnOptions: defaultColumnOptions,
  },
};
