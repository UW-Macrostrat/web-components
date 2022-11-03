import axios from "axios";

export function canonicalizeMapboxURL(url: string) {
  return url.replace("mapbox://styles/", "https://api.mapbox.com/styles/v1/");
}

export async function getMapboxStyle(
  style: string | object,
  params: { access_token: string; [k: string]: any }
): Promise<object> {
  if (typeof style !== "string") {
    return style;
  }

  // We fetch styles if they aren't avaialable locally
  let { data, status, statusText } = await axios.get(
    canonicalizeMapboxURL(style),
    {
      params,
    }
  );
  if (status !== 200) {
    throw new Error(`Returned ${status}: ${statusText}`);
  }
  return data;
}

export function mergeStyles(...styles) {
  let merged = { ...styles[0] };
  merged.sources = {};
  merged.layers = [];
  for (let s of styles) {
    merged.sources = { ...merged.sources, ...(s.sources ?? {}) };
    merged.layers = merged.layers.concat(s.layers);
    merged.sprite = s.sprite ?? merged.sprite;
    merged.glyphs = s.glyphs ?? merged.glyphs;
  }
  return merged;
}
