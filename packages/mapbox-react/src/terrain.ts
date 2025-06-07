import { useMapRef } from "./context";
import { useEffect } from "react";
import {
  AnyLayer,
  RasterDemSource,
  Style,
  AnySourceData,
  SkyLayer,
} from "mapbox-gl";
import type mapboxgl from "mapbox-gl";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useMapStyleOperator } from "./hooks";

type SourceConfig = Partial<RasterDemSource>;

export function use3DTerrain(
  shouldEnable: boolean = true,
  sourceName: string = "terrain",
  sourceCfg: SourceConfig = {}
) {
  const mapRef = useMapRef();
  return useMapStyleOperator(
    (style) => {
      const map = mapRef.current;
      setup3DTerrain(map, shouldEnable, sourceName, sourceCfg);
    },
    [sourceName, shouldEnable, sourceCfg]
  );
}

export function setup3DTerrain(
  map: mapboxgl.Map,
  shouldEnable: boolean = true,
  sourceID: string = null,
  sourceCfg: SourceConfig = {}
) {
  const style = map.getStyle();
  const currentTerrainSource = getTerrainSourceID(style);
  let demSourceID = sourceID ?? currentTerrainSource ?? "mapbox-dem";

  if (shouldEnable) {
    addDefault3DStyles(map, demSourceID, sourceCfg);
  }

  // Enable or disable terrain depending on our current desires...
  const currentTerrain = map.getTerrain();
  if (shouldEnable && currentTerrain == null) {
    map.setTerrain({ source: demSourceID, exaggeration: 1 });
  } else if (!shouldEnable && currentTerrain != null) {
    map.setTerrain(null);
  }
}

export function getTerrainLayerForStyle(
  style: Style,
  sourceName: string = null
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
  sourceName: string = null
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
  sourceCfg: Partial<RasterDemSource> = {}
) {
  const style = map.getStyle();

  const hasTerrain = Object.entries(style.sources).some(
    ([key, source]: [string, AnySourceData]) =>
      source.type === "raster-dem" && key === sourceName
  );

  const hasSky = Object.values(style.layers).some(
    (lyr: AnyLayer) => lyr.type == "sky"
  );

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

const defaultFogLight: mapboxgl.Fog = {
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

const defaultFogDark: mapboxgl.Fog = {
  range: [10, 20],
  color: "hsla(0, 0%, 0%, 0.43)",
  "high-color": "hsl(207, 23%, 5%)",
  "space-color": "hsl(207, 23%, 10%)",
  "horizon-blend": 0.1,
  "star-intensity": 0.5,
};
