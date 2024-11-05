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

function MapEaseWrapper({ children, locationName, nextLocation, description }) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */
  const style = useBasicStylePair();

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
        description,
        h("p", ["Viewing ", h("strong", locationName)]),
        h("button", { onClick: nextLocation }, ["Next location"]),
      ]),
    },
    [
      h(
        MapView,
        {
          style,
          projection: { name: "globe" },
        },
        children
      ),
    ]
  );
}

function BasicMapEaseTo(props: { position: MapEaseToState }) {
  const ref = useMapRef();
  const { isInitialized } = useMapStatus();
  const { position } = props;
  useEffect(() => {
    if (ref.current == null || !isInitialized) return;
    console.log("Easing to", position);
    ref.current.easeTo(position);
  }, [ref.current, position, isInitialized]);
  return null;
}

function MapEaseToInner({ position }: { position: MapEaseToState }) {
  useMapEaseTo(position);
  return null;
}

export function UseMapEaseToStory() {
  const [location, nextLocation] = useLocation();
  const { name, ...position } = location;
  return h(
    MapEaseWrapper,
    {
      locationName: name,
      nextLocation,
      description: h("p", [
        "This story demonstrates the ",
        h("code", "useMapEaseTo"),
        " hook",
      ]),
    },
    h(MapEaseToInner, { position })
  );
}

export function BasicMapEaseToStory() {
  const [location, nextLocation] = useLocation();
  const { name, ...position } = location;
  return h(
    MapEaseWrapper,
    {
      locationName: name,
      nextLocation,
      description: "This story demonstrates basic map easing",
    },
    h(BasicMapEaseTo, { position })
  );
}

function useLocation() {
  const [ix, setIx] = useState(0);
  const nextLocation = () => setIx((ix + 1) % locations.length);
  return [locations[ix], nextLocation];
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Mapbox React/useMapEaseTo",
  component: BasicMapEaseToStory,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
} as Meta<typeof BasicMapEaseToStory>;

type Story = StoryObj<typeof BasicMapEaseToStory>;
