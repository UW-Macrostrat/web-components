import type { Meta } from "@storybook/react";
import type { StoryObj } from "@storybook/react";
import {
  LocationPanel,
  MapAreaContainer,
  MapMarker,
  MapView,
  useBasicStylePair,
} from "../src";
import h from "@macrostrat/hyper";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { useMapRef, useMapStatus } from "@macrostrat/mapbox-react";
import { useEffect } from "react";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function DetailPanelMap(props) {
  const { mapPosition, children, bounds, ...rest } = props;

  const style = useBasicStylePair();

  return h(
    MapAreaContainer,
    {
      navbar: null,
      contextPanel: null,
      ...rest,
    },
    h(MapView, { style, mapPosition, mapboxToken, bounds }, children)
  );
}

export function PositionInformation(props) {
  const { position, onClose, title, children, ...rest } = props;

  const detailPanel = h(
    LocationPanel,
    {
      position,
      title,
      onClose,
    },
    [h("h1", "New York City"), h("p", "New York is a pretty cool place")]
  );

  return h(
    DetailPanelMap,
    {
      ...rest,
      detailPanel,
    },
    [
      h.if(position != null)(MapMarker, {
        position,
      }),
      children,
    ]
  );
}

const position = {
  lat: 40.7128,
  lng: -74.006,
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof PositionInformation> = {
  title: "Map interface/Map details panel",
  component: PositionInformation,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
    decorators: [
      (Story) => {
        return h(DarkModeProvider, h(Story));
      },
    ],
  },
  args: {
    mapPosition: {
      camera: {
        ...position,
        altitude: 300000,
      },
    },
    position,
    onClose() {
      console.log("Close");
    },
  },
};

export default meta;

type Story = StoryObj<typeof PositionInformation>;

export const WithoutPosition = {
  args: {
    mapPosition: {
      camera: {
        ...position,
        altitude: 300000,
      },
    },
    position: null,
    title: "New York City",
    onClose() {
      console.log("Close");
    },
  },
};

export const NotCloseable = {
  args: {
    mapPosition: {
      camera: {
        ...position,
        altitude: 300000,
      },
    },
    title: "New York City",
    position: null,
    onClose: null,
  },
};

const bounds = [-74.2591, 40.4774, -73.7004, 40.9176];

export const WithBounds: Story = {
  args: {
    bounds,
    position: null,
    mapPosition: null,
    title: "New York City",
    onClose() {
      console.log("Close");
    },
    children: [h(MapBoundsLayer, { bounds })],
  },
};

function MapBoundsLayer(props) {
  const { bounds } = props;
  const isLoaded = useMapStatus((map) => map.isStyleLoaded);
  const ref = useMapRef();
  useEffect(() => {
    const map = ref.current;
    if (map == null) return;
    if (!isLoaded) return;

    map.addSource("bounds", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [bounds[0], bounds[1]],
              [bounds[2], bounds[1]],
              [bounds[2], bounds[3]],
              [bounds[0], bounds[3]],
              [bounds[0], bounds[1]],
            ],
          ],
        },
      },
    });

    map.addLayer({
      id: "bounds",
      type: "line",
      source: "bounds",
      layout: {},
      paint: {
        "line-color": "red",
        "line-width": 2,
      },
    });
  }, [isLoaded]);

  return null;
}
