import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LngLatCoords, LngLatProps } from "../src/location-info";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<LngLatProps> = {
  title: "Map interface/Utilities/LngLatCoords",
  component: LngLatCoords,
};

export default meta;

type Story = StoryObj<LngLatProps>;

export const Primary: Story = {
  args: {
    position: {
      lat: 40.7128,
      lng: -74.006,
    },
    zoom: 10,
    precision: null,
  },
  argTypes: {
    zoom: {
      type: {
        name: "number",
        required: false,
      },
    },
    precision: {
      type: {
        name: "number",
        required: false,
      },
    },
  },
};

export const LowZoom: Story = {
  args: {
    position: {
      lat: 40.7128,
      lng: -74.006,
    },
    zoom: 2,
  },
};
