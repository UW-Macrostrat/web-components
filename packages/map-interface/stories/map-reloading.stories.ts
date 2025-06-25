import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
// Import other components
import { Spinner, Switch } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useAsyncEffect, useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useState } from "react";
import {
  FloatingNavbar,
  MapView,
  MapAreaContainer,
  buildInspectorStyle,
} from "../src";
import styles from "./map-reloading.stories.module.sass";
import { MapPosition } from "@macrostrat/mapbox-utils";
import { useMapStatus } from "@macrostrat/mapbox-react";

const h = hyper.styled(styles);

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
mapboxgl.accessToken = mapboxToken;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MapInspector> = {
  title: "Map interface/Map reloading",
  component: MapInspector,
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
    title: "Terrain reloading",
    mapPosition: {
      camera: {
        lat: 39.58,
        lng: -105.15,
        altitude: 2000,
        bearing: 0,
        pitch: 80,
      },
    },
    overlayStyle: buildMacrostratStyle(),
  },
};

function useDevBasemapURL(styleType: "macrostrat" | "standard" = "macrostrat") {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;
  if (styleType == "macrostrat") {
    return isEnabled
      ? "mapbox://styles/jczaplewski/cl5uoqzzq003614o6url9ou9z?optimize=true"
      : "mapbox://styles/jczaplewski/clatdbkw4002q14lov8zx0bm0?optimize=true";
  } else {
    return isEnabled
      ? "mapbox://styles/mapbox/dark-v10"
      : "mapbox://styles/mapbox/light-v10";
  }
}

function MapInspector({
  title = "Map inspector",
  mapPosition = null,
  style,
  bounds = null,
}: {
  headerElement?: React.ReactNode;
  title?: string;
  style?: mapboxgl.Style | string;
  controls?: React.ReactNode;
  children?: React.ReactNode;
  mapboxToken?: string;
  projection?: string;
  mapPosition?: MapPosition;
  bounds?: [number, number, number, number];
  fitViewport?: boolean;
  styleType?: "standard" | "macrostrat";
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;
  style ??= useDevBasemapURL();

  const [macrostrat, setMacrostrat] = useState(true);
  const [xRay, setXRay] = useState(false);

  let overlayStyle: mapboxgl.Style | null =
    useMemo((): mapboxgl.Style | null => {
      if (macrostrat) {
        return buildMacrostratStyle();
      }
      return null;
    }, [macrostrat]);

  const [actualStyle, setActualStyle] = useState(null);

  useEffect(() => {
    if (overlayStyle == null) {
      setActualStyle(style);
      return;
    }

    buildInspectorStyle(style, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
      xRay,
    }).then(setActualStyle);
  }, [style, xRay, mapboxToken, isEnabled, overlayStyle]);

  return h(
    MapAreaContainer,
    {
      navbar: h(
        FloatingNavbar,
        {
          height: "fit-content",
        },
        h("div.header-block", [
          h("div.top-row", [h("h3.header-title", title), h(MapLoadingSpinner)]),
          h("div.controls", [
            h(
              "p",
              "When styles are updated, 3D terrain should remain enabled."
            ),
            h(Switch, {
              checked: macrostrat,
              label: "Macrostrat",
              onChange() {
                setMacrostrat(!macrostrat);
              },
            }),
            h(Switch, {
              checked: xRay,
              label: "X-ray mode",
              onChange() {
                setXRay(!xRay);
              },
            }),
          ]),
        ])
      ),
      fitViewport: true,
    },
    h(MapView, {
      style: actualStyle,
      mapPosition,
      projection: { name: "globe" },
      bounds,
    })
  );
}

function MapLoadingSpinner() {
  const isLoading = useMapStatus((state) => state.isLoading);
  if (!isLoading) return null;
  return h(Spinner, { size: 20 });
}
