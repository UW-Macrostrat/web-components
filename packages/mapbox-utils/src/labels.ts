import mapboxgl, { Map } from "mapbox-gl";

export function removeMapLabels(
  style: mapboxgl.Style,
  shouldRemove: boolean = true
): mapboxgl.Style {
  // Disable labels on the map
  for (let lyr of style.layers) {
    if (!("layout" in lyr)) continue;
    const isLabelLayer = lyr.layout["text-field"] != null;
    if (isLabelLayer) {
      lyr.layout.visibility = shouldRemove ? "none" : "visible";
    }
  }
  return style;
}

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
