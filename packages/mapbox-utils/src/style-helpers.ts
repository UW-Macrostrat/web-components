import { FeatureCollection } from "geojson";
import {GeoJSONSource} from "mapbox-gl";

export function setGeoJSON(
  map: mapboxgl.Map,
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

