import { FeatureCollection } from "geojson";
import type { GeoJSONSourceRaw, GeoJSONSource, Style, Map } from "mapbox-gl";

export function setGeoJSON(
  map: Map,
  sourceID: string,
  data: FeatureCollection
) {
  let source = map.getSource(sourceID) as GeoJSONSource | null;
  if (source == null) {
    map.addSource(sourceID, { type: "geojson", data });
  } else {
    source.setData(data);
  }
}

export function buildGeoJSONSource(
  data: FeatureCollection | null = null
): GeoJSONSourceRaw {
  return {
    type: "geojson",
    data: data ?? {
      type: "FeatureCollection",
      features: [],
    },
  };
}

export function removeSourceFromStyle(
  style: Style,
  sourceID: string,
  sourceLayer: string | null = null
) {
  const newStyle = { ...style };
  const sources = style.sources;
  if (sourceID != null && sourceLayer == null) {
    newStyle.sources = { ...sources };
    delete newStyle.sources[sourceID];
  }
  newStyle.layers = newStyle.layers.filter((d) => {
    if ("source" in d) {
      if (d.source == sourceID || sourceID == null) {
        if (sourceLayer == null) return sourceID == null;
        if (d["source-layer"] == sourceLayer) return false;
      }
    }
    return true;
  });
  return newStyle;
}
