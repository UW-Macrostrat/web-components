import mapboxgl from "mapbox-gl";
import { getMapboxStyle } from "@macrostrat/mapbox-utils";
import chroma from "chroma-js";

interface XRayOptions {
  color?: string;
  inDarkMode?: boolean;
  mapboxToken?: string;
}

export async function buildXRayStyle(
  baseStyle: string | object,
  params: XRayOptions = null
) {
  const {
    inDarkMode = false,
    color = "rgb(74, 242, 161)",
    mapboxToken,
  } = params;
  const style = await getMapboxStyle(baseStyle, { access_token: mapboxToken });

  const sources = Object.keys(style.sources);

  let layers = [];
  for (let layer of style.layers) {
    let newLayer = transformMapboxLayer(layer, color, inDarkMode);
    if (newLayer != null) {
      layers.push(newLayer);
    }
  }

  return {
    ...style,
    layers,
  };
}

function transformMapboxLayer(layer, color, inDarkMode) {
  const c = chroma(color);
  const xRayColor = (opacity = 1, darken = 0) => {
    if (!inDarkMode) {
      return chroma(color)
        .darken(2 - darken)
        .alpha(opacity)
        .css();
    }
    return c.alpha(opacity).darken(darken).css();
  };

  if (layer.type == "background") {
    return null;
  }

  let newLayer = { ...layer };

  if (layer.type == "fill") {
    newLayer.paint = {
      "fill-color": xRayColor(0.1),
      "fill-outline-color": xRayColor(0.5),
    };
  } else if (layer.type == "line") {
    newLayer.paint = {
      "line-color": xRayColor(0.5, 0),
      "line-width": 1.5,
    };
  } else if (layer.type == "symbol") {
    newLayer.paint = {
      "text-color": xRayColor(1, -0.5),
      "text-halo-color": "#000",
    };
  } else if (layer.type == "circle") {
    newLayer.paint = {
      "circle-color": xRayColor(0.5, 0),
      "circle-stroke-color": xRayColor(0.5, 1),
      "circle-radius": 3,
    };
  }

  return newLayer;
}
