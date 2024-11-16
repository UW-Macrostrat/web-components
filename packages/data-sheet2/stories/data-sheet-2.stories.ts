import type { Meta, StoryObj } from "@storybook/react";

import { DataSheetTest } from "./data-sheet-test";

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
