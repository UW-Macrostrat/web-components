import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";
import type { StoryObj } from "@storybook/react";
import { buildMacrostratStyle } from "../../mapbox-styles/src";

import { DevMapPage } from "../src";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function WrappedComponent(props) {
  return h(DevMapPage, { ...props, mapboxToken });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof DevMapPage> = {
  title: "Map interface/Development map page",
  component: WrappedComponent,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DevMapPage>;

export const Primary: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 0,
        lng: 0,
        altitude: 50000000,
      },
    },
  },
};

export const ZoomedIn: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -74.006,
        altitude: 300000,
      },
    },
  },
};

export const WithMacrostratOverlay: Story = {
  args: {
    title: "Macrostrat",
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -74.006,
        altitude: 300000,
      },
    },
    overlayStyle: buildMacrostratStyle({}),
  },
};
