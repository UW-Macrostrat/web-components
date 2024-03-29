import { useMapRef } from "./context";
import { useEffect } from "react";
import { AnySourceImpl, AnyLayer, RasterDemSource, Map } from "mapbox-gl";

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

function addDefault3DStyles(
  map,
  sourceName = "terrain",
  sourceCfg: Partial<RasterDemSource> = {}
) {
  const style = map.getStyle();
  const hasTerrain = Object.values(style.sources).some(
    (source: AnySourceImpl) => source.type === "raster-dem"
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
