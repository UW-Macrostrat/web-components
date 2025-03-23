import { MapView, MapViewProps } from "@macrostrat/map-interface";
import {
  MapboxMapProvider,
  useMapClickHandler,
  useMapEaseTo,
  useMapStyleOperator,
} from "@macrostrat/mapbox-react";
import { LngLatBounds } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { Feature, FeatureCollection, LineString } from "geojson";
import { ReactNode, useMemo } from "react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { useBasicMapStyle } from "@macrostrat/map-interface";

import { buildCrossSectionLayers } from "@macrostrat/map-styles";
import {
  ColumnCorrelationProvider,
  CorrelationMapProps,
  useCorrelationMapStore,
} from "./state";

export function InsetMap({
  controls,
  className,
  children,
  style,
  mapStyle,
  accessToken,
  ...rest
}: any) {
  const _style = useMemo(() => {
    return mapStyle ?? useBasicMapStyle();
  }, [mapStyle]);

  return h("div.inset-map", { className, style }, [
    h(MapboxMapProvider, [
      controls,
      h(
        MapView,
        {
          style: _style,
          accessToken,
          standalone: true,
          ...rest,
        },
        children
      ),
    ]),
  ]);
}

interface CorrelationMapInnerProps extends MapViewProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
}

export function ColumnCorrelationMap(
  props: CorrelationMapProps & CorrelationMapInnerProps
) {
  const { focusedLine, columns, apiBaseURL, onSelectColumns, ...rest } = props;

  return h(
    ColumnCorrelationProvider,
    {
      focusedLine,
      columns,
      apiBaseURL,
      onSelectColumns,
    },
    h(ColumnCorrelationMapCore, rest)
  );
}

function ColumnCorrelationMapCore(props: CorrelationMapInnerProps) {
  const { padding = 50, children, ...rest } = props;

  return h(InsetMap, { ...rest, boxZoom: false, dragRotate: false }, [
    h(ColumnsLayer),
    h(SelectedColumnsLayer),
    h(MapClickHandler),
    h(SectionLine, { padding }),
    children,
  ]);
}

function MapClickHandler() {
  const onClickMap = useCorrelationMapStore((state) => state.onClickMap);
  console.log("onClickMap", onClickMap);

  useMapClickHandler(
    (e) => {
      onClickMap(e, { type: "Point", coordinates: e.lngLat.toArray() });
    },
    [onClickMap]
  );

  return null;
}

function SelectedColumnsLayer() {
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns
  );

  useMapStyleOperator(
    (map) => {
      let features = focusedColumns;

      const data: FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      const columnCentroidLine: Feature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: features.map(
            (col) => col.properties.centroid.geometry.coordinates
          ),
        },
        properties: {},
      };

      setGeoJSON(map, "selected-columns", data);
      setGeoJSON(map, "selected-column-centroids", {
        type: "FeatureCollection",
        features: [columnCentroidLine],
      });
    },
    [focusedColumns]
  );
  return null;
}

function ColumnsLayer({ enabled = true }) {
  const columns = useCorrelationMapStore((state) => state.columns);
  console.log("Setting up columns layer", columns);

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };
      const sourceID = "columns";
      setGeoJSON(map, sourceID, data);

      const columnLayers: any[] = buildColumnLayers(sourceID);
      for (let layer of columnLayers) {
        if (map.getSource(layer.source) == null) {
          continue;
        }
        if (map.getLayer(layer.id) == null) {
          map.addLayer(layer);
        }
      }
    },
    [columns, enabled]
  );
  return null;
}

function buildColumnLayers(sourceID: string) {
  return [
    {
      id: "selected-columns-fill",
      type: "fill",
      source: "selected-columns",
      paint: {
        "fill-color": "rgba(255, 0, 0, 0.1)",
      },
    },
    {
      id: "selected-column-centroids-line",
      type: "line",
      source: "selected-column-centroids",
      paint: {
        "line-color": "rgba(255, 0, 0, 0.8)",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "selected-column-centroids-points",
      type: "circle",
      source: "selected-column-centroids",
      paint: {
        "circle-radius": 4,
        "circle-color": "rgba(255, 0, 0, 0.8)",
      },
    },
    {
      id: "columns-fill",
      type: "fill",
      source: sourceID,
      paint: {
        "fill-color": "rgba(0, 0, 0, 0.1)",
      },
    },
    {
      id: "columns-line",
      type: "line",
      source: sourceID,
      paint: {
        "line-color": "rgba(0, 0, 0, 0.5)",
        "line-width": 1,
      },
    },
  ];
}

function SectionLine({ padding }: { padding: number }) {
  const focusedLine = useCorrelationMapStore((state) => state.focusedLine);

  // Setup focused line
  useMapStyleOperator(
    (map) => {
      if (focusedLine == null) {
        return;
      }
      // TODO: there is apparently a bug that results in this being called before style loads.
      // Perhaps this has to do with hot reloading since it only seems to happen later.
      // if (!map.isStyleLoaded()) {
      //   return;
      // }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: focusedLine,
            properties: { id: "focusedLine" },
          },
        ],
      };

      setGeoJSON(map, "crossSectionLine", data);
      setGeoJSON(map, "crossSectionEndpoints", {
        type: "FeatureCollection",
        features: focusedLine.coordinates.map((coord) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: coord },
          properties: {},
        })),
      });

      // Add layers
      const layers = buildCrossSectionLayers();
      for (let layer of layers) {
        if (map.getSource(layer.source) == null) {
          continue;
        }
        if (map.getLayer(layer.id) == null) {
          map.addLayer(layer);
        }
      }
    },
    [focusedLine]
  );

  const bounds = useMemo(() => {
    if (focusedLine == null || focusedLine?.coordinates.length < 2) {
      return null;
    }
    let bounds = new LngLatBounds();
    for (let coord of focusedLine.coordinates) {
      bounds.extend(coord);
    }
    return bounds;
  }, [focusedLine]);

  useMapEaseTo({ bounds, padding, trackResize: true });

  return null;
}
