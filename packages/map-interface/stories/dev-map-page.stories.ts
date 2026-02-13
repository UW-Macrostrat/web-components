import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { DevMapPage as _DevMapPage, MapInspectorV2 } from "../src";
import h from "@macrostrat/hyper";
import { useOverlayStyle } from "@macrostrat/mapbox-react";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function DevMapPage(props) {
  return _DevMapPage({ ...props, mapboxToken });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof DevMapPage> = {
  title: "Map interface/Development map page",
  component: DevMapPage,
  parameters: {
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

export const WithBounds: Story = {
  args: {
    title: "Macrostrat",
    overlayStyle: buildMacrostratStyle({}),
    // Zoom to Utah
    bounds: [-114.052885, 36.997966, -109.04106, 42.001567],
  },
};

export const LowAltitudeOblique: Story = {
  args: {
    title: "Low altitude oblique view",
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    overlayStyle: buildMacrostratStyle({}),
  },
};

export const TerrainDisabled: Story = {
  args: {
    title: "Terrain disabled",
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    enableTerrain: false,
    overlayStyle: buildMacrostratStyle({}),
  },
};

function MacrostratMapLayer({ isEnabled }) {
  useOverlayStyle(() => {
    console.log("Building overlay style, isEnabled =", isEnabled);
    if (!isEnabled) return null;
    const style = buildMacrostratStyle({});
    console.log("Overlay style:", style);
    return style;
  }, [isEnabled]);
  return null;
}

export const WithOverlayLayerAsChild: Story = {
  args: {
    title: "Overlay layer as child",
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    overlayEnabled: true,
  },
  render(args) {
    const { overlayEnabled = true, ...rest } = args;
    return h(MapInspectorV2, { ...rest, mapboxToken }, [
      h(MacrostratMapLayer, { isEnabled: overlayEnabled }),
    ]);
  },
};
