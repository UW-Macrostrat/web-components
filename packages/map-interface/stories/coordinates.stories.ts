import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react";

import { LngLatCoords } from "../src/location-info";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof LngLatCoords> = {
  title: "Map interface/Utilities/LngLatCoords",
  component: LngLatCoords,
};

export default meta;

type Story = StoryObj<typeof LngLatCoords>;

export const Primary: Story = {
  args: {
    position: {
      lat: 40.7128,
      lng: -74.006,
    },
  },
};
