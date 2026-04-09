import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle, MacrostratStyleOpts } from "../src";

import { MapView, useBasicStylePair } from "@macrostrat/map-interface";
import h from "@macrostrat/hyper";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import { type MapPosition, removeMapLabels } from "@macrostrat/mapbox-utils";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

interface MapStyleStoryProps extends MacrostratStyleOpts {
  mapPosition?: MapPosition;
  transformStyle?: (style: any) => any;
}

function MapStylesStoryWrapper(props: MapStyleStoryProps) {
  const { mapPosition, transformStyle, ...rest } = props;

  const style = useBasicStylePair();
  const macrostratStyle = buildMacrostratStyle(rest);

  const overlayStyles = [macrostratStyle];

  return h(
    MapboxMapProvider,
    h(MapView, {
      height: "100vh",
      style,
      overlayStyles,
      mapboxToken,
      transformStyle,
    }),
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapView> = {
  title: "Map styles/Map styles",
  component: MapStylesStoryWrapper,
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

type Story = StoryObj<typeof MapStylesStoryWrapper>;

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

export const ZoomedInEmphasized: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -74.006,
        altitude: 300000,
      },
    },
    emphasized: true,
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
  },
};

export const WithoutLabels: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -77.006,
        altitude: 4000,
        pitch: 45,
      },
    },
    transformStyle: removeMapLabels,
  },
};
