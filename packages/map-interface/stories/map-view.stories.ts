import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { MapView } from "../src";
import h from "@macrostrat/hyper";
import { MapboxMapProvider, useOverlayStyle } from "@macrostrat/mapbox-react";
import { removeMapLabels } from "@macrostrat/mapbox-utils";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function MapViewStoryWrapper(props) {
  return h(
    MapboxMapProvider,
    h(MapView, {
      height: "100vh",
      style: "mapbox://styles/mapbox/streets-v11",
      ...props,
      mapboxToken,
    }),
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapView> = {
  title: "Map interface/Map view",
  component: MapViewStoryWrapper,
  parameters: {
    previewTabs: {
      "storybook/docs/panel": { hidden: true }, // Hides the Docs tab
    },
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
    argTypes: {
      mapboxToken: {
        table: {
          disable: true,
        },
        control: false,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof MapView>;

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

const macrostratStyle = buildMacrostratStyle({});

export const WithMacrostratOverlay: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -74.006,
        altitude: 300000,
      },
    },
    overlayStyles: [macrostratStyle],
  },
};

export const WithBounds: Story = {
  args: {
    overlayStyles: [macrostratStyle],
    // Zoom to Utah
    bounds: [-114.052885, 36.997966, -109.04106, 42.001567],
  },
};

export const LowAltitudeOblique: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    overlayStyles: [macrostratStyle],
  },
};

export const WithoutLabels: Story = {
  args: {
    title: "No labels",
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    overlayStyles: [macrostratStyle],
    transformStyle: removeMapLabels,
  },
};

export const TerrainDisabled: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    enableTerrain: false,
    overlayStyles: [macrostratStyle],
  },
};

function MacrostratMapLayer({ isEnabled }) {
  useOverlayStyle(() => {
    if (!isEnabled) return null;
    const style = buildMacrostratStyle({});
    return style;
  }, [isEnabled]);
  return null;
}
