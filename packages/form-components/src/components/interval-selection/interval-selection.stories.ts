import type { Meta, StoryObj } from "@storybook/react";

import { IntervalSelection, IntervalSelectionProps } from ".";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "IntervalSelection",
  component: IntervalSelection,
} as Meta<IntervalSelectionProps>;

type Story = StoryObj<IntervalSelectionProps>;

export const Primary: Story = {};
