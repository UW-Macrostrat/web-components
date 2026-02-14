import { useMapRef } from "./context";
import type {
  AnyLayer,
  Source,
  Style,
  AnySourceData,
  SkyLayer,
  Expression,
} from "mapbox-gl";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useMapStyleOperator } from "./hooks";

interface RasterDemSource {
  name?: string;
  type: "raster-dem";
  id?: string;

  url?: string | undefined;
  tiles?: string[] | undefined;
  bounds?: number[] | undefined;
  minzoom?: number | undefined;
  maxzoom?: number | undefined;
  tileSize?: number | undefined;
  attribution?: string | undefined;
  encoding?: "terrarium" | "mapbox" | undefined;
}

type SourceConfig = Partial<RasterDemSource>;

export function use3DTerrain(
  shouldEnable: boolean = true,
  sourceName: string | null = null,
  sourceCfg: SourceConfig = {},
) {
  const mapRef = useMapRef();
  return useMapStyleOperator(
    (style) => {
      const map = mapRef.current;
      setup3DTerrain(map, shouldEnable, sourceName, sourceCfg);
    },
    [sourceName, shouldEnable, sourceCfg],
  );
}

export function setup3DTerrain(
  map: mapboxgl.Map,
  shouldEnable: boolean = true,
  sourceID: string = null,
  sourceCfg: SourceConfig = {},
) {
  const style = map.getStyle();
  const currentTerrainSourceID = getTerrainSourceID(style);
  let demSourceID = sourceID ?? currentTerrainSourceID ?? "mapbox-dem";

  const currentTerrain = map.getTerrain();

  let nextTerrainSourceID = demSourceID;

  if (shouldEnable && currentTerrain == null) {
    nextTerrainSourceID ??= addDefault3DStyles(map, demSourceID, sourceCfg);
    map.setTerrain({ source: nextTerrainSourceID, exaggeration: 1 });
  } else if (!shouldEnable && currentTerrain != null) {
    map.setTerrain(null);
  }
}

export function getTerrainLayerForStyle(
  style: Style,
  sourceName: string = null,
): Partial<Style> {
  /** Add required elements for terrain directly to a style object */

  const currentTerrainSource = getTerrainSourceID(style);
  const demSourceID = currentTerrainSource ?? sourceName ?? "mapbox-dem";

  let newStyle: Partial<Style> = {
    sources: {},
    layers: [],
  };

  const hasTerrainSource = currentTerrainSource != null;
  if (!hasTerrainSource) {
    newStyle.sources[demSourceID] = defaultRasterDEM as AnySourceData;
  }

  if (!hasSkyLayer(style)) {
    newStyle.layers.push(defaultSkyLayer as AnyLayer);
  }

  const hasTerrain = "terrain" in style;
  if (!hasTerrain) {
    newStyle.terrain = { source: demSourceID, exaggeration: 1 };
  }
  return newStyle;
}

export function addTerrainToStyle(
  style: Style,
  sourceName: string = null,
): Style {
  const newStyle = getTerrainLayerForStyle(style, sourceName);
  return mergeStyles(style, newStyle);
}

function hasSkyLayer(style: Style): boolean {
  return Object.values(style.layers).some((lyr: AnyLayer) => lyr.type == "sky");
}

function getTerrainSourceID(style: Style): string | null {
  for (const [key, source] of Object.entries(style.sources)) {
    if (source.type == "raster-dem") {
      return key;
    }
  }
  return null;
}

function addDefault3DStyles(
  map: mapboxgl.Map,
  sourceName = "terrain",
  sourceCfg: Partial<RasterDemSource> = {},
) {
  const style = map.getStyle();

  const currentTerrainSource = getTerrainSourceID(style);
  const hasTerrain = currentTerrainSource != null;

  let terrainSourceID = currentTerrainSource ?? sourceName;

  if (!hasTerrain) {
    map.addSource(sourceName, {
      ...defaultRasterDEM,
      ...sourceCfg,
    } as AnySourceData);
  }

  if (!hasSkyLayer(style)) {
    map.addLayer(defaultSkyLayer);
  }
  // Fog requires knowledge of whether we have a light or dark style
  // if (map.getFog() == null) {
  //   map.setFog(defaultFog);
  // }
  return terrainSourceID;
}

const defaultRasterDEM: RasterDemSource = {
  type: "raster-dem",
  url: "mapbox://mapbox.mapbox-terrain-dem-v1",
  tileSize: 512,
  maxzoom: 14,
};

const defaultSkyLayer: SkyLayer = {
  id: "sky",
  type: "sky",
  paint: {
    "sky-type": "atmosphere",
    "sky-atmosphere-sun": [0.0, 0.0],
    "sky-atmosphere-sun-intensity": 15,
  },
};

/** For some reason, Mapbox GL does not export the Fog interface */
export interface Fog {
  color?: string | Expression | undefined;
  "horizon-blend"?: number | Expression | undefined;
  range?: number[] | Expression | undefined;
  "high-color"?: string | Expression | undefined;
  "space-color"?: string | Expression | undefined;
  "star-intensity"?: number | Expression | undefined;
}

const defaultFogLight: Fog = {
  color: "#ffffff",
  // @ts-ignore
  "space-color": [
    "interpolate",
    ["linear"],
    ["zoom"],
    4,
    "hsl(215, 28%, 64%)",
    7,
    "hsl(209, 92%, 85%)",
  ],
  "star-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.35, 6, 0],
  range: [5, 15],
};

const defaultFogDark: Fog = {
  range: [10, 20],
  color: "hsla(0, 0%, 0%, 0.43)",
  "high-color": "hsl(207, 23%, 5%)",
  "space-color": "hsl(207, 23%, 10%)",
  "horizon-blend": 0.1,
  "star-intensity": 0.5,
};
