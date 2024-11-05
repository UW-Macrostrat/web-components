import h from "@macrostrat/hyper";
import type { Meta } from "@storybook/react";
import type { StoryObj } from "@storybook/react";
import { Card } from "@blueprintjs/core";
import {
  FloatingNavbar,
  MapAreaContainer,
  MapLoadingButton,
  MapView,
} from "../src";

import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";
import {
  useMapRef,
  useBasicStylePair,
  MapEaseToState,
  useMapEaseTo,
  useMapStatus,
} from "@macrostrat/mapbox-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

type Location = { name: string } & MapEaseToState;

const locations: Location[] = [
  {
    name: "New York",
    center: [-74.006, 40.7128],
    zoom: 10,
  },
  {
    name: "San Francisco",
    center: [-122.4194, 37.7749],
  },
  {
    name: "United States",
    center: [-98.5795, 39.8283],
    zoom: 3,
  },
  {
    name: "viewed from the Moon-ish",
    zoom: 0.02,
  },
];

export function MapEaseToDemo() {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */
  const style = useBasicStylePair();

  const [ix, setIx] = useState(0);
  const { name, ...loc } = locations[ix];

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, {
        rightElement: h(MapLoadingButton, {
          large: true,
          style: {
            marginRight: "-5px",
          },
        }),
        title: "Map easing",
      }),
      contextPanel: h(Card, [
        h("h3", "Map easing demo"),
        h("p", [
          "This story demonstrates the ",
          h("code", "useMapEaseTo"),
          " hook",
        ]),
        h("p", ["Viewing ", h("strong", name)]),
        h("button", { onClick: () => setIx((ix + 1) % locations.length) }, [
          "Next location",
        ]),
      ]),
    },
    [
      h(
        MapView,
        {
          style,
          projection: { name: "globe" },
        },
        h(MapEaseWrapper, { location: loc })
      ),
    ]
  );
}

function MapEaseWrapper(props: { location: MapEaseToState }) {
  const ref = useMapRef();
  const { isInitialized } = useMapStatus();
  const { location } = props;
  useEffect(() => {
    if (ref.current == null) return;
    console.log("Easing to", location);
    ref.current.easeTo(location);
  }, [ref.current, location, isInitialized]);
  return null;
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Mapbox React/useMapEaseTo",
  component: MapEaseToDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
} as Meta<typeof MapEaseToDemo>;

type Story = StoryObj<typeof MapEaseToDemo>;
