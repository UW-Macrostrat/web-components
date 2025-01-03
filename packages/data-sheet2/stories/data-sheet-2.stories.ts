import type { Meta, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";

import { TestDataSheet, useTestData } from "./data-sheet-test";

function DataSheetTest() {
  const [data, columnSpec] = useTestData();
  return h(TestDataSheet, { data, columnSpec });
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
