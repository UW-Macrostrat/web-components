import type { StyleSpecification } from "maplibre-gl";

export function optimizeTerrain(
  style: StyleSpecification | null,
  terrainSourceURL: string | null,
  hillshadeColors: string[] = ["#ffffffcc", "#00000033"],
) {
  let deletedSourceKeys = [];
  for (const [key, source] of Object.entries(style.sources)) {
    if (source.type === "raster-dem") {
      console.log("Found DEM source:", key, source);
    }
    if (source.type === "raster-dem" && source.url != terrainSourceURL) {
      delete style.sources[key];
      deletedSourceKeys.push(key);
    }
  }
  deletedSourceKeys.push("mapbox://mapbox.terrain-rgb");

  let vals = {};
  if (terrainSourceURL?.includes("{x}")) {
    vals["tiles"] = [terrainSourceURL];
  } else {
    vals["url"] = terrainSourceURL;
  }

  style.sources.terrain = {
    type: "raster-dem",
    tileSize: 512,
    maxzoom: 14,
    ...vals,
  };

  const [highlightColor, shadowColor] = hillshadeColors;

  // use a multidirectional hillshade (Maplibre only)
  for (const layer of style.layers) {
    if (layer.type === "hillshade") {
      layer.paint = {
        "hillshade-method": "multidirectional",
        "hillshade-highlight-color": [
          highlightColor,
          highlightColor,
          highlightColor,
          highlightColor,
        ],
        "hillshade-shadow-color": [
          shadowColor,
          shadowColor,
          shadowColor,
          shadowColor,
        ],
        "hillshade-illumination-direction": [270, 315, 0, 45],
        "hillshade-illumination-altitude": [30, 30, 30, 30],
      };
    }
  }

  style.layers = style.layers.map((l) => {
    if (deletedSourceKeys.includes(l.source)) {
      return {
        ...l,
        source: "terrain",
      };
    }
    return l;
  });

  // We don't need 3d terrain for Maplibre
  delete style.terrain;

  return style;
}

export function prepareStyleForMaplibre(
  style: mapboxgl.StyleSpecification | string,
): maplibre.StyleSpecification {
  // Convert any Mapbox-specific properties to Maplibre-compatible ones
  let newStyle = {
    ...style,
    layers: style.layers.filter((d) => d.type !== "sky"),
  };

  delete newStyle.projection;

  return newStyle;
}
