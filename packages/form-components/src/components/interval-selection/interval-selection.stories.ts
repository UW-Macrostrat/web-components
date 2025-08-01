import type { Meta, StoryObj } from "@storybook/react-vite";

import { IntervalSelection, IntervalSelectionProps } from ".";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Interval selection",
  component: IntervalSelection,
} as Meta<IntervalSelectionProps>;

type Story = StoryObj<IntervalSelectionProps>;

export const Primary: Story = {};
