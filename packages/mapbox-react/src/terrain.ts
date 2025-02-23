import { useMapRef } from "./context";
import { useEffect } from "react";
import { AnySourceImpl, AnyLayer, RasterDemSource, Style } from "mapbox-gl";

type SourceConfig = Partial<RasterDemSource>;

export function use3DTerrain(
  shouldEnable: boolean = true,
  sourceName: string = "terrain",
  sourceCfg: SourceConfig = {}
) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  useEffect(() => {
    if (map == null) return;
    setup3DTerrain(map, shouldEnable, sourceName, sourceCfg);
    map.on("style.load", () => {
      setup3DTerrain(map, shouldEnable, sourceName, sourceCfg);
    });
  }, [map, shouldEnable, sourceName]);
}

export function setup3DTerrain(
  map: mapboxgl.Map,
  shouldEnable: boolean = true,
  sourceName: string = "terrain",
  sourceCfg: SourceConfig = {}
) {
  if (!map.isStyleLoaded()) {
    return;
  }
  if (shouldEnable) {
    addDefault3DStyles(map, sourceName, sourceCfg);
  }
  // Enable or disable terrain depending on our current desires...
  const currentTerrain = map.getTerrain();
  if (shouldEnable && currentTerrain == null) {
    map.setTerrain({ source: sourceName, exaggeration: 1 });
  } else if (!shouldEnable && currentTerrain != null) {
    map.setTerrain(null);
  }
}

export function enable3DTerrainLegacy(
  map,
  shouldEnable: boolean,
  sourceID: string | null = null
) {
  if (!map.style?._loaded) {
    map.once("style.load", () => {
      enable3DTerrainLegacy(map, shouldEnable, sourceID);
    });
    return;
  }
  setup3DTerrainLegacy(map, shouldEnable, sourceID);
}

function setup3DTerrainLegacy(
  map,
  shouldEnable: boolean,
  sourceID: string | null = null
) {
  const currentTerrainSource = getTerrainSourceID(map);
  let demSourceID = sourceID ?? currentTerrainSource ?? "mapbox-dem";

  console.log("Enabling 3D terrain with source", demSourceID);

  // Enable or disable terrain depending on our current desires...
  const currentTerrain = map.getTerrain();

  if (!shouldEnable) {
    if (currentTerrain != null) map.setTerrain(null);
    return;
  }
  if (currentTerrain != null) return;

  // Add a DEM source if one is not found already.
  if (map.getSource(demSourceID) == null) {
    map.addSource(demSourceID, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  // add a sky layer that will show when the map is highly pitched
  if (map.getLayer("sky") == null) {
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 0.0],
        "sky-atmosphere-sun-intensity": 15,
      },
    });
  }

  map.setTerrain({ source: demSourceID, exaggeration: 1 });
  console.log(map.getTerrain());
}

function getTerrainSourceID(map) {
  for (const [key, source] of Object.entries(map.getStyle().sources)) {
    if (source.type == "raster-dem") {
      return key;
    }
  }
  return null;
}

function addDefault3DStyles(
  map,
  sourceName = "terrain",
  sourceCfg: Partial<RasterDemSource> = {}
) {
  const style = map.getStyle();

  const hasTerrain = Object.entries(style.sources).some(
    ([key, source]: [string, AnySourceImpl]) =>
      source.type === "raster-dem" && key === sourceName
  );

  const hasSky = Object.values(style.layers).some(
    (lyr: AnyLayer) => lyr.type == "sky"
  );

  if (!hasTerrain) {
    map.addSource(sourceName, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
      ...sourceCfg,
    });
  }

  if (!hasSky) {
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 0.0],
        "sky-atmosphere-sun-intensity": 15,
      },
    });
  }
  if (map.getFog() == null) {
    map.setFog({
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
    });
  }
}
