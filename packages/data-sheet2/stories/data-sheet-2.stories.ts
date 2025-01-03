import type { Meta, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";

import { TestDataSheet, useTestData } from "./data-sheet-test";

function DataSheetTest(rest) {
  const [data, columnSpec] = useTestData();
  return h(TestDataSheet, { data, columnSpec, ...rest });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/Data sheet (v2)",
  component: DataSheetTest,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {},
};

// Now try a version reordering the columns
export const Reorderable: StoryObj<{}> = {
  args: {
    enableColumnReordering: true,
    onColumnsReordered: (oldIndex, newIndex, length) => {
      console.log("Reordered columns", oldIndex, newIndex, length);
    },
  },
  argTypes: {
    columnSpec: {
      control: {
        type: "object",
      },
    },
  },
};
