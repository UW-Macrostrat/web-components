import axios from "axios";
import { Style } from "mapbox-gl";

export function canonicalizeMapboxURL(url: string) {
  return url.replace("mapbox://styles/", "https://api.mapbox.com/styles/v1/");
}

export async function getMapboxStyle(
  style: string | object,
  params: { access_token: string; [k: string]: any }
): Promise<Style> {
  if (typeof style !== "string") {
    return style as Style;
  }

  // We fetch styles if they aren't avaialable locally
  let { data, status, statusText } = await axios.get(
    canonicalizeMapboxURL(style),
    { params }
  );
  if (status !== 200) {
    throw new Error(`Returned ${status}: ${statusText}`);
  }
  return data;
}

export function mergeStyles(...styles) {
  let merged = {
    version: 8,
    sprite: "mapbox://sprites/mapbox/bright-v9",
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    sources: {},
    layers: [],
  };
  for (let s of styles) {
    const sources = { ...merged.sources, ...(s?.sources ?? {}) };
    const layers = merged.layers.concat(s?.layers ?? []);

    merged = { ...merged, ...s, sources, layers };
  }
  return merged;
}
