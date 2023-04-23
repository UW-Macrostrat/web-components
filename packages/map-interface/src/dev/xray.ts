import { getMapboxStyle, mergeStyles } from "@macrostrat/mapbox-utils";
import chroma from "chroma-js";
import mapboxgl from "mapbox-gl";

interface XRayOptions {
  color?: string;
  inDarkMode?: boolean;
  mapboxToken?: string;
  xRaySources?: string[];
}

export async function buildXRayStyle(
  baseStyle: string | object,
  params: XRayOptions = null
) {
  const {
    inDarkMode = false,
    color = "rgb(74, 242, 161)",
    mapboxToken,
    xRaySources
  } = params;
  const style = await getMapboxStyle(baseStyle, { access_token: mapboxToken });
  const sources = xRaySources ?? Object.keys(style.sources);

  let layers = [];
  for (let layer of style.layers) {
    if (!sources.includes(layer.source)) {
      layers.push(layer);
      continue;
    }
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

type InspectorStyleOptions = XRayOptions & {
  xRay?: boolean;
};

export async function buildInspectorStyle(
  baseStyle: mapboxgl.Style | string,
  overlayStyle: mapboxgl.Style | string | null = null,
  params: InspectorStyleOptions = {}
) {
  const { mapboxToken, xRay = false, xRaySources: _xRaySources, ...rest } = params;
  let xRaySources = _xRaySources;
  let style = await getMapboxStyle(baseStyle, {
    access_token: mapboxToken,
  });

  if (overlayStyle != null) {
    const overlay = await getMapboxStyle(overlayStyle, {
      access_token: mapboxToken,
    });
    style = mergeStyles(style, overlay);
    xRaySources ??= Object.keys(overlay.sources);
  }


  if (xRay) {
    // If we haven't specified sources, then we'll use all of them
    xRaySources ??= Object.keys(style.sources);

    style = await buildXRayStyle(style, { ...rest, mapboxToken, xRaySources });
  }
  return style;
}
