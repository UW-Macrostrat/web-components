import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import h from "@macrostrat/hyper";
import mapboxgl from "mapbox-gl";
import React, { ReactNode } from "react";
import { useCallback, useState, useEffect, useMemo } from "react";
import {
  MapAreaContainer,
  PanelCard,
  FloatingNavbar,
  MapLoadingButton,
  MapMarker,
  useBasicMapStyle,
  LocationPanel,
  MapView,
  FeaturePanel,
} from "../src";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

function blurbFor(id: number): ReactNode[] {
  const paragraphs = (id * 7) % 9; // 0–8
  const paras = lorem.generateParagraphs(paragraphs).split("\n");
  return paras.map((p) => h("p", p));
}

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const macrostratStyle = buildMacrostratStyle();

const overlayStyles = [macrostratStyle];

const paragraphs = blurbFor(10);

function MapInspectorV2({
  mapPosition = null,
  children = null,
  bounds = null,
  ...rest
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  if (mapboxToken != null) {
    mapboxgl.accessToken = mapboxToken;
  }

  const [isOpen, setOpen] = useState(false);

  const style = useBasicMapStyle();

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);
  let detailElement: React.ReactNode = null;
  if (inspectPosition != null) {
    detailElement = h(
      LocationPanel,
      {
        onClose() {
          setInspectPosition(null);
        },
        position: inspectPosition,
      },
      paragraphs,
    );
  }

  const title = isOpen ? "Ready to rock" : null;

  return h(
    MapAreaContainer,
    {
      style: {
        "--map-context-stack-width": "300px",
      },
      navbar: h(FloatingNavbar, {
        rightElement: h(MapLoadingButton, {
          large: true,
          active: isOpen,
          onClick: () => setOpen(!isOpen),
          icon: isOpen ? "chevron-left" : "chevron-right",
        }),
        width: isOpen ? 300 : "fit-content",
        title,
      }),
      contextPanel: h(PanelCard, [
        h("h3", "Incredibly incisive material"),
        h(
          "p",
          "This panel presents a level of detailed analysis unparalleled in modern analytical information design.",
        ),
      ]),
      detailPanel: detailElement,
      contextPanelOpen: isOpen,
    },
    h(
      MapView,
      {
        style,
        mapPosition,
        projection: { name: "globe" },
        mapboxToken,
        bounds,
        overlayStyles,
      },
      [
        h(MapMarker, {
          position: inspectPosition,
          setPosition: setInspectPosition,
        }),
        children,
      ],
    ),
  );
}

function DevMapPage(props) {
  const [isExpanded, setExpanded] = useState(false);

  return h(MapInspectorV2, { ...props, title: null, mapboxToken });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Map interface/Resizing",
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

export const WithMacrostratOverlay: Story = {
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

export const Global: Story = {
  args: {
    mapPosition: {
      camera: {
        lat: 40.7128,
        lng: -74.006,
        altitude: 4000000,
      },
    },
  },
};
