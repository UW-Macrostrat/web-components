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
import {
  setupStyleImageManager,
  StyleImageManagerOptions,
  renderTexturesPattern,
} from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import textures from "textures";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

interface InsetMapOptions {
  bounds: any;
  className?: string;
  onInitializeMap?: (a: Map) => void;
  style?: any;
  metersPerPixel?: number;
}

function BaseInsetMap({
  bounds,
  className,
  onInitializeMap,
  metersPerPixel = 200,
  style,
}: InsetMapOptions) {
  const tileBounds = computeTiledBoundsForMap(bounds, {
    metersPerPixel,
    tileSize: 512,
    padding: 20,
  });

  const transformRequest = useMapboxRequestTransformer(mapboxToken);

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
          const map = new Map({
            ...opts,
            transformRequest,
            pixelRatio: 2,
          });
          onInitializeMap?.(map);
          return map;
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

function InsetMap({
  bounds,
  className,
  onInitializeMap,
  metersPerPixel,
}: Omit<InsetMapOptions, "style">) {
  const style = useInsetMapStyle(mapboxToken);
  if (style == null) return null;
  return h(BaseInsetMap, {
    style,
    bounds,
    className,
    onInitializeMap,
    metersPerPixel,
  });
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

export function WithOverlay() {
  const baseStyle = useInsetMapStyle(mapboxToken);

  const overlayStyle = {
    sources: {
      faults: {
        type: "geojson",
        // Major strike-slip faults in the San Francisco Bay Area
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [-122.85, 38.1],
                  [-122.35, 37.5],
                ],
              },
              properties: {
                name: "San Andreas Fault",
              },
            },
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [-122.48, 38.1],
                  [-121.9, 37.5],
                ],
              },
              properties: {
                name: "Hayward Fault",
              },
            },
          ],
        },
      },
      // Pull-apart basin geometry
      // Trapezoidal area between the two faults
      basin: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "Pull-apart basin",
              },
              geometry: {
                coordinates: [
                  [
                    [-122.25822428421804, 37.54229311032287],
                    [-122.00528127518058, 37.56808407036215],
                    [-122.25821273730716, 37.82895125974261],
                    [-122.53, 37.8],
                    [-122.25822428421804, 37.54229311032287],
                  ],
                ],
                type: "Polygon",
              },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "fault-basin-fill",
        type: "fill",
        source: "basin",
        layout: {},
        paint: {
          "fill-color": "#888888",
          "fill-opacity": 0.5,
          "fill-pattern": "fgdc:406:#ff0000:transparent",
        },
      },
      {
        id: "fault-lines",
        type: "line",
        source: "faults",
        layout: {},
        paint: {
          "line-color": "black",
          "line-width": 4,
        },
      },
      {
        id: "fault-line-symbols",
        type: "symbol",
        source: "faults",
        layout: {
          "symbol-placement": "line",
          "icon-image": "line-symbol:right-lateral-fault",
          "icon-size": 2,
          "symbol-spacing": 200,
          "icon-allow-overlap": true,
        },
      },
      {
        id: "basin-labels",
        type: "symbol",
        source: "basin",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["PT Sans Bold"],
          "text-size": 16,
          "text-letter-spacing": 0.1,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "red",
          "text-halo-color": "white",
          "text-halo-width": 2,
        },
      },
      {
        id: "fault-labels",
        type: "symbol",
        source: "faults",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["PT Sans Bold"],
          "text-size": 16,
          "symbol-placement": "line",
          "text-rotation-alignment": "map",
          "text-letter-spacing": 0.1,
          "text-allow-overlap": true,
          "text-offset": [0, 1],
        },
        paint: {
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 2,
        },
      },
    ],
  };

  const style = baseStyle == null ? null : mergeStyles(baseStyle, overlayStyle);

  return h(BaseInsetMap, {
    // San Francisco
    bounds: [-123.17, 37.48, -121.75, 38.17],
    onInitializeMap(map) {
      setupStyleImageManager(map);
    },
    style,
  });
}

export function WithTexturesResolver() {
  const baseStyle = useInsetMapStyle(mapboxToken);

  const textureStyle = {
    sources: {
      squares: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "t0",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-122.5, 37.7],
                    [-122.3, 37.7],
                    [-122.3, 37.9],
                    [-122.5, 37.9],
                    [-122.5, 37.7],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: {
                name: "t1",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-122.7, 37.7],
                    [-122.5, 37.7],
                    [-122.5, 37.9],
                    [-122.7, 37.9],
                    [-122.7, 37.7],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "square-textures",
        type: "fill",
        source: "squares",
        layout: {},
        paint: {
          "fill-color": "#ffffffaa",
          "fill-pattern": ["concat", "textures:", ["get", "name"]],
        },
      },
    ],
  };

  const style = baseStyle == null ? null : mergeStyles(baseStyle, textureStyle);

  return h(BaseInsetMap, {
    // San Francisco
    bounds: [-123.0, 37.6, -122.2, 38.0],
    onInitializeMap(map) {
      setupStyleImageManager(map, {
        pixelRatio: 8,
        resolvers: {
          textures: texturesResolver,
        },
      });
    },
    style,
  });
}

async function texturesResolver(
  id: string,
  args: string[],
  options: StyleImageManagerOptions,
) {
  const name = args[0];
  // Construct a texture pattern image

  let spec = null;
  if (name === "t0") {
    spec = textures
      .circles()
      .size(8)
      .radius(2)
      .fill("red")
      .background("#ffffff88");
  } else if (name === "t1") {
    spec = textures
      .lines()
      .orientation("6/8")
      .size(8)
      .strokeWidth(1)
      .stroke("green");
  }

  if (spec == null) {
    throw new Error(`No texture pattern found for name: ${name}`);
  }

  return await renderTexturesPattern(spec, {
    pixelRatio: 5,
  });
}
