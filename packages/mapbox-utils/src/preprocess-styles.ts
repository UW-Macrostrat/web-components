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

export function mergeStyles(s1, s2) {
  let merged = { ...s1, ...s2 };
  merged.sources = { ...(s1.sources ?? {}), ...(s2.sources ?? {}) };

  // we need to overwrite layers that have the same id
  merged.layers = s1.layers
    .filter((l) => {
      let found = s2.layers.find((l2) => l2.id === l.id);
      return !found;
    })
    .concat(s2.layers);

  merged.sprite = s1.sprite ?? s2.sprite;
  merged.glyphs = s1.glyphs ?? s2.glyphs;
  return merged;
}
