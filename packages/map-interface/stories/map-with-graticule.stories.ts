import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
// Import other components
import { Spinner, Switch } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useState } from "react";
import { MapView, MapAreaContainer } from "../src";
import styles from "./map-reloading.stories.module.sass";
import { MapPosition } from "@macrostrat/mapbox-utils";
import { useMapStatus } from "@macrostrat/mapbox-react";

const h = hyper.styled(styles);

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
mapboxgl.accessToken = mapboxToken;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapInspector> = {
  title: "Map interface/Map with graticule",
  component: MapWithGraticule,
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

type Story = StoryObj<typeof MapInspector>;

export const Default: Story = {
  args: {
    title: "Map with graticule",
    mapPosition: {
      camera: {
        lat: 39.58,
        lng: -105.15,
        altitude: 2000,
      },
    },
  },
};

function useDevBasemapURL(styleType: "macrostrat" | "standard" = "macrostrat") {
  const dark = useDarkMode();
  return dark?.isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
}

function MapWithGraticule({
  title = "Map inspector",
  mapPosition = null,
  bounds = null,
}: {
  headerElement?: React.ReactNode;
  title?: string;
  mapboxToken?: string;
  projection?: string;
  mapPosition?: MapPosition;
  bounds?: [number, number, number, number];
  fitViewport?: boolean;
}) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;
  const style = useDevBasemapURL();

  const [macrostrat] = useState(true);

  let overlayStyle: mapboxgl.Style | null =
    useMemo((): mapboxgl.Style | null => {
      if (macrostrat) {
        return buildMacrostratStyle();
      }
      return null;
    }, [macrostrat]);

  return h(
    MapAreaContainer,
    {
      navbar: null,
      fitViewport: true,
    },
    h(MapView, {
      style,
      overlayStyles: [overlayStyle],
      mapPosition,
      mapboxToken,
      projection: { name: "mercator" },
      bounds,
    }),
  );
}

function MapLoadingSpinner() {
  const isLoading = useMapStatus((state) => state.isLoading);
  if (!isLoading) return null;
  return h(Spinner, { size: 20 });
}
