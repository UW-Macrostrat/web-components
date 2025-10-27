import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  useMapboxRequestTransformer,
  TiledMapArea,
  computeTiledBoundsForMap,
  useInsetMapStyle,
  Scalebar,
} from "../src";
import { Map } from "maplibre-gl";
import maplibre from "maplibre-gl";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function InsetMap({ bounds, className }: { bounds: any; initializeMap: any }) {
  const tileBounds = computeTiledBoundsForMap(bounds, {
    metersPerPixel: 120,
    tileSize: 512,
    padding: 20,
  });

  const transformRequest = useMapboxRequestTransformer(mapboxToken);

  const style = useInsetMapStyle(mapboxToken);

  if (style == null) return null;

  return h(
    "div.inset-map",
    { className },
    h(
      TiledMapArea,
      {
        tileBounds: tileBounds,
        style,
        initializeMap(opts: maplibre.MapOptions) {
          return new Map({
            ...opts,
            transformRequest,
            pixelRatio: 8,
          });
        },
      },
      h(Scalebar, {
        className: "map-scalebar",
        scale: tileBounds.realMetersPerPixel,
        width: 250,
      }),
    ),
  );
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof InsetMap> = {
  title: "Static map utils/Inset map",
  component: InsetMap,
};

export default meta;

export const Default: StoryObj<typeof InsetMap> = {
  args: {
    // Los angeles
    bounds: [-118.67, 33.7, -117.5, 34.34],
  },
};
