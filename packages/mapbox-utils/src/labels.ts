import { Map, LayerSpecification } from "mapbox-gl";

export function removeMapLabels(
  style: mapboxgl.Style,
  shouldRemove: boolean = true,
): mapboxgl.Style {
  // Disable labels on the map
  let newStyle = { ...style };
  newStyle.layers = style.layers.map((lyr): LayerSpecification => {
    if (!("layout" in lyr)) return lyr;
    const isLabelLayer = lyr.layout["text-field"] != null;
    if (isLabelLayer && shouldRemove) return null;
    const visibility = isLabelLayer ? "none" : "visible";
    return {
      ...lyr,
      layout: { ...lyr.layout, visibility },
    } as LayerSpecification;
  });
  newStyle.layers = newStyle.layers.filter((d) => d != null);
  return newStyle;
}

export function toggleMapLabelVisibility(
  map: Map,
  visible: boolean,
  omitLayers: string[] = [],
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
