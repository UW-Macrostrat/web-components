import { FeatureCollection } from "geojson";
// @ts-expect-error
import type { GeoJSONSource, Style, Map, GeoJSONSourceRaw } from "mapbox-gl";
import type mapboxgl from "mapbox-gl";

export function setGeoJSON(
  map: Map,
  sourceID: string,
  data: FeatureCollection,
) {
  let source = map.getSource(sourceID) as GeoJSONSource | null;
  if (source == null) {
    map.addSource(sourceID, { type: "geojson", data });
  } else {
    source.setData(data);
  }
}

export function buildGeoJSONSource(
  data: FeatureCollection | null = null,
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
  sourceLayer: string | null = null,
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

enum ExistingLayersAction {
  Replace = "replace",
  Merge = "merge",
  Skip = "skip",
}

type StyleUpdateConfig = {
  onExistingLayers?: ExistingLayersAction;
  removeLayers?: string[];
};

export function updateStyleLayers(
  map: mapboxgl.Map,
  layers: mapboxgl.Layer[],
  config?: StyleUpdateConfig,
) {
  const { onExistingLayers = ExistingLayersAction.Merge, removeLayers = [] } =
    config ?? {};

  // Add layers to the map
  for (const layer of layers) {
    let existingLayer = map.getLayer(layer.id);
    if (
      onExistingLayers === ExistingLayersAction.Replace ||
      removeLayers.includes(layer.id)
    ) {
      // If the layer already exists, remove it first
      map.removeLayer(layer.id);
      existingLayer = null;
    }
    if (existingLayer == null) {
      // if the source doesn't exist, continue
      if (layer.source && !map.getSource(layer.source)) {
        console.warn(
          `Source ${layer.source} for layer ${layer.id} does not exist, skipping layer addition.`,
        );
        continue;
      }

      map.addLayer(layer);
      continue;
    }
    if (onExistingLayers === ExistingLayersAction.Skip) {
      console.warn(
        `Layer ${layer.id} already exists, not adding again. Use 'replace' or 'update' to overwrite.`,
      );
      continue;
    }
    if (onExistingLayers === ExistingLayersAction.Merge) {
      // Try to update all properties of the existing layer that have changed
      if (layer.type !== existingLayer.type) {
        console.warn(
          `Layer ${layer.id} type mismatch, expected ${existingLayer.type}, got ${layer.type}. Skipping update.`,
        );
        continue;
      }
      const newPaint = (layer.paint ?? {}) as mapboxgl.PaintSpecification;
      const oldPaint = (existingLayer.paint ??
        {}) as mapboxgl.PaintSpecification;
      for (const [key, value] of Object.entries(newPaint)) {
        const k1 = key as keyof mapboxgl.PaintSpecification;
        if (value.toString() != oldPaint[k1]?.toString()) {
          map.setPaintProperty(layer.id, k1, value);
        }
      }
      const newLayout = (layer.layout ?? {}) as mapboxgl.LayoutSpecification;
      const existingLayout = (existingLayer.layout ??
        {}) as mapboxgl.LayoutSpecification;
      for (const [key, value] of Object.entries(newLayout)) {
        const k1 = key as keyof mapboxgl.LayoutSpecification;
        console.log("Checking layout property", k1, value);
        if (value.toString() != existingLayout[k1]?.toString()) {
          map.setLayoutProperty(layer.id, k1, value);
        }
      }
      if (layer.filter !== undefined) {
        if (layer.filter.toString() !== existingLayer.filter?.toString()) {
          map.setFilter(layer.id, layer.filter);
        }
      }
    }
  }
}
