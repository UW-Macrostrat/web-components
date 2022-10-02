import { Map } from "mapbox-gl";

export function toggleMapLabelVisibility(
  map: Map,
  visible: boolean,
  omitLayers: string[] = []
) {
  // Disable labels on the map
  for (let lyr of map.getStyle().layers) {
    if (!("layout" in lyr)) continue;
    const isLabelLayer = lyr.layout["text-field"] != null;
    if (isLabelLayer && !omitLayers.includes(lyr.id)) {
      map.setLayoutProperty(lyr.id, "visibility", visible ? "visible" : "none");
    }
  }
}
