import type { Meta } from "@storybook/react";
import type { StoryObj } from "@storybook/react";
import {
  FeaturePanel,
  FeatureSelectionHandler,
  LocationPanel,
  MapAreaContainer,
  MapMarker,
  MapView,
  TileInfo,
  useBasicStylePair,
} from "../src";
import h from "@macrostrat/hyper";
import { DarkModeProvider } from "@macrostrat/ui-components";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function DetailPanelMap(props) {
  const { mapPosition, children, ...rest } = props;

  const style = useBasicStylePair();

  return h(
    MapAreaContainer,
    {
      navbar: null,
      contextPanel: null,
      ...rest,
    },
    h(MapView, { style, mapPosition, mapboxToken }, children)
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof DetailPanelMap> = {
  title: "Map interface/Map details panel",
  component: DetailPanelMap,
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
    decorators: [
      (Story) => {
        return h(DarkModeProvider, h(Story));
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof DetailPanelMap>;

export function PositionInformation(props) {
  const { position, ...rest } = props;

  const detailPanel = h(
    LocationPanel,
    {
      position,
    },
    [
      h("h1", "Test location"),
      h("p", "This is a test description of a specific map location"),
    ]
  );

  return h(
    DetailPanelMap,
    {
      ...props,
      detailPanel,
    },
    [
      h(MapMarker, {
        position,
        setPosition() {},
      }),
    ]
  );
}

const position = {
  lat: 40.7128,
  lng: -74.006,
};

PositionInformation.args = {
  mapPosition: {
    camera: {
      ...position,
      altitude: 300000,
    },
  },
  position,
};
