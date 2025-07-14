import type { Meta, StoryObj } from "@storybook/react-vite";

import InfoDrawer from "../src/map-panel/components/info-drawer";
import h from "@macrostrat/hyper";
import {
  LocationPanel,
  MapAreaContainer,
  MapMarker,
  MapView,
  useBasicStylePair,
} from "../src";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const position = { lat: 44.60085563149249, lng: -96.16783150353609 }
const zoom = 3.9392171056922325;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<InfoDrawer> = {
  title: "Map interface/Map Panel",
  component: InfoDrawer,
};

export default meta;

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
    h(MapView, { style, mapPosition, mapboxToken, bounds }, children),
  );
}

export function Primary(props) {
  const { bounds, onClose, title, children, detailPanel, ...rest } =
    props;

  const _detailPanel =
    detailPanel ??
    h(InfoDrawer, {
      position,
      zoom
    });

  return h(
    DetailPanelMap,
    {
      ...rest,
      detailPanel: _detailPanel,
      bounds,
      mapPosition: {
        camera: {
          ...position,
          altitude: 300000,
        },
      }
    },
    [
      h.if(position != null)(MapMarker, {
        position,
        setPosition: null,
      }),
      children,
    ],
  );
}