import {
  useMapClickHandler,
  useMapEaseTo,
  useMapStyleOperator,
  useOverlayStyle,
} from "@macrostrat/mapbox-react";
import { LngLatBounds, Style } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { Feature, FeatureCollection } from "geojson";
import { ReactNode, useMemo, useRef } from "react";
import { setGeoJSON, buildGeoJSONSource } from "@macrostrat/mapbox-utils";

import { useCorrelationMapStore } from "./state";
import { InsetMap, type InsetMapProps } from "../inset-map";
import { BaseColumnsLayer } from "../layers";
import { buildCrossSectionLayers } from "@macrostrat/map-styles";

export interface CorrelationMapProps extends InsetMapProps {
  padding?: number;
  children?: ReactNode;
  accessToken?: string;
  columnColor?: string;
  projectID?: number;
}

export function ColumnCorrelationMap(props: CorrelationMapProps) {
  const { padding = 50, children, columnColor, projectID, ...rest } = props;

  return h(
    InsetMap,
    {
      ...rest,
      boxZoom: false,
      dragRotate: false,
    },
    [
      h(ColumnsLayer, { color: columnColor }),
      h(SelectedColumnsLayer),
      h(MapClickHandler),
      h(ColumnInteractionHandler),
      h(HoveredColumnHighlight),
      h(ColumnZoomer, { padding }),
      h(SectionLine, { padding }),
      children,
    ],
  );
}

function ColumnZoomer({ padding }: { padding: number }) {
  /** Frame a single column when `zoomColumn` is set (e.g. header click). */
  const zoomColumn = useCorrelationMapStore((state) => state.zoomColumn);
  const zoomNonce = useCorrelationMapStore((state) => state.zoomNonce);
  const columns = useCorrelationMapStore((state) => state.columns);

  const bounds = useMemo(() => {
    if (zoomColumn == null || columns == null) return null;
    const col = columns.find((c) => c.properties?.col_id === zoomColumn);
    if (col?.geometry == null) return null;
    const b = new LngLatBounds();
    forEachCoordinate(col.geometry, (coord) =>
      b.extend(coord as [number, number]),
    );
    return b.isEmpty() ? null : b;
    // zoomNonce forces a fresh bounds object so repeat clicks re-frame
  }, [zoomColumn, zoomNonce, columns]);

  useMapEaseTo({ bounds, padding: padding * 2 });
  return null;
}

function forEachCoordinate(geometry: any, fn: (coord: number[]) => void) {
  const walk = (coords: any) => {
    if (typeof coords[0] === "number") {
      fn(coords);
    } else {
      for (const c of coords) walk(c);
    }
  };
  if (geometry?.coordinates != null) walk(geometry.coordinates);
}

const columnLayers = ["columns-fill", "columns-points"];

function MapClickHandler() {
  const onClickMap = useCorrelationMapStore((state) => state.onClickMap);

  useMapClickHandler(
    (e) => {
      onClickMap(e, { type: "Point", coordinates: e.lngLat.toArray() });
    },
    [onClickMap],
  );

  return null;
}

function ColumnInteractionHandler() {
  /** Per-column click (manual selection) and hover highlighting. */
  const toggleColumn = useCorrelationMapStore((state) => state.toggleColumn);
  const setHoveredColumn = useCorrelationMapStore(
    (state) => state.setHoveredColumn,
  );
  const isManual = useCorrelationMapStore(
    (state) => state.selectionMode === "manual",
  );
  const hoveredRef = useRef<number | string | null>(null);

  // Click a column to toggle it in/out of the selection (manual mode only)
  useMapStyleOperator(
    (map) => {
      if (!isManual) return;
      const onClick = (e) => {
        const colID = e.features?.[0]?.properties?.col_id;
        if (colID != null) toggleColumn(colID);
      };
      map.on("click", columnLayers, onClick);
      return () => map.off("click", columnLayers, onClick);
    },
    [isManual, toggleColumn],
  );

  // Hover highlighting (via the columns layer's `hover` feature-state)
  useMapStyleOperator(
    (map) => {
      const clearHover = () => {
        if (hoveredRef.current != null) {
          map.setFeatureState(
            { source: "columns", id: hoveredRef.current },
            { hover: false },
          );
          hoveredRef.current = null;
        }
      };
      const onMove = (e) => {
        const f = e.features?.[0];
        if (f == null) return;
        if (hoveredRef.current !== f.id) {
          clearHover();
          map.setFeatureState({ source: "columns", id: f.id }, { hover: true });
          hoveredRef.current = f.id;
        }
        setHoveredColumn(f.properties?.col_id ?? null);
        map.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        clearHover();
        setHoveredColumn(null);
        map.getCanvas().style.cursor = "";
      };
      map.on("mousemove", columnLayers, onMove);
      map.on("mouseleave", columnLayers, onLeave);
      return () => {
        map.off("mousemove", columnLayers, onMove);
        map.off("mouseleave", columnLayers, onLeave);
        clearHover();
      };
    },
    [setHoveredColumn],
  );

  return null;
}

function HoveredColumnHighlight() {
  /** Reflects the store's `hoveredColumn` on the map (e.g. when a column is
   * hovered elsewhere in the UI) using the `highlighted` feature-state. */
  const hoveredColumn = useCorrelationMapStore((state) => state.hoveredColumn);
  const columns = useCorrelationMapStore((state) => state.columns);
  const appliedRef = useRef<number | string | null>(null);

  useMapStyleOperator(
    (map) => {
      if (appliedRef.current != null) {
        map.setFeatureState(
          { source: "columns", id: appliedRef.current },
          { highlighted: false },
        );
        appliedRef.current = null;
      }
      if (hoveredColumn == null || columns == null) return;
      const col = columns.find((c) => c.properties?.col_id === hoveredColumn);
      const id = (col as any)?.id ?? col?.properties?.col_id;
      if (id == null) return;
      map.setFeatureState({ source: "columns", id }, { highlighted: true });
      appliedRef.current = id;
    },
    [hoveredColumn, columns],
  );

  return null;
}

function SelectedColumnsLayer() {
  useOverlayStyle(() => selectedColumnsStyle, []);

  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
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
            (col) => col.properties.centroid.geometry.coordinates,
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
    [focusedColumns],
  );
  return null;
}

function ColumnsLayer({ enabled = true, color }) {
  const columns = useCorrelationMapStore((state) => state.columns);
  return h(BaseColumnsLayer, { enabled, color, columns });
}

const selectedColumnsStyle: Style = {
  version: 8,
  sources: {
    "selected-columns": buildGeoJSONSource(),
    "selected-column-centroids": buildGeoJSONSource(),
  },
  layers: [
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
  ],
};

const lineOfSectionStyle: Style = {
  version: 8,
  sources: {
    elevationMarker: buildGeoJSONSource(),
    crossSectionLine: buildGeoJSONSource(),
    crossSectionEndpoints: buildGeoJSONSource(),
  },
  layers: buildCrossSectionLayers(),
};

function SectionLine({ padding }: { padding: number }) {
  useOverlayStyle(() => lineOfSectionStyle, []);
  const focusedLine = useCorrelationMapStore((state) => state.focusedLine);
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );

  // Setup focused line (only drawn in line-of-section mode)
  useMapStyleOperator(
    (map) => {
      if (focusedLine == null) {
        // Clear any previously-drawn line (e.g. after switching to manual mode)
        setGeoJSON(map, "crossSectionLine", emptyFeatureCollection);
        setGeoJSON(map, "crossSectionEndpoints", emptyFeatureCollection);
        return;
      }
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
    },
    [focusedLine],
  );

  const bounds = useMemo(() => {
    // In line mode, frame the line; in manual mode, frame the selected columns
    const coords: number[][] =
      focusedLine != null && focusedLine.coordinates.length >= 2
        ? focusedLine.coordinates
        : focusedColumns.map((c) => c.properties.centroid.geometry.coordinates);
    if (coords.length < 2) return null;
    const bounds = new LngLatBounds();
    for (const coord of coords) {
      bounds.extend(coord as [number, number]);
    }
    return bounds;
  }, [focusedLine, focusedColumns]);

  useMapEaseTo({ bounds, padding, trackResize: true });

  return null;
}

const emptyFeatureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
