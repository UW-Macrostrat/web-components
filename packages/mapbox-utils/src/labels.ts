import { Map } from "mapbox-gl";

export function toggleMapLabelVisibility(map: Map, visible: boolean) {
  // Disable labels on the map
  console.log("Toggling map visibility");
  for (let lyr of map.getStyle().layers) {
    if (!("layout" in lyr)) continue;
    const isLabelLayer = lyr.layout["text-field"] != null;
    if (isLabelLayer) {
      map.setLayoutProperty(lyr.id, "visibility", visible ? "visible" : "none");
    }
  }
}
