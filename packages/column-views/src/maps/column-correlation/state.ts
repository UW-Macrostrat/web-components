import { LineString, Point } from "geojson";
import { create, StoreApi, useStore } from "zustand";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
// Turf intersection
import { lineIntersect } from "@turf/line-intersect";
import distance from "@turf/distance";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { centroid } from "@turf/centroid";
import mapboxgl from "mapbox-gl";
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import { useAsyncEffect } from "@macrostrat/ui-components";
import { createComputed } from "zustand-computed";
import { useMacrostratStore } from "../../data-provider/base";

export interface CorrelationMapInput {
  columns: ColumnGeoJSONRecord[];
  focusedLine: LineString | null;
}

export interface CorrelationMapStore extends CorrelationMapInput {
  onClickMap: (event: mapboxgl.MapMouseEvent, point: Point) => void;
}

export interface CorrelationProviderProps extends CorrelationMapInput {
  projectID?: number;
  inProcess?: boolean;
  columns: ColumnGeoJSONRecord[] | null;
  children: ReactNode;
  onSelectColumns?: (
    columns: FocusedColumnGeoJSONRecord[],
    line: LineString | null
  ) => void;
}

const CorrelationStoreContext =
  createContext<StoreApi<CorrelationMapStore> | null>(null);

type ComputedStore = {
  focusedColumns: FocusedColumnGeoJSONRecord[];
};

/** A computed store that will automatically update when the state changes */
const computed = createComputed((state: CorrelationMapStore): ComputedStore => {
  return {
    // We compute the focused columns based on columns and focusedLine
    focusedColumns: buildCorrelationColumns(state.columns, state.focusedLine),
  };
}) as any;

export function ColumnCorrelationProvider({
  children,
  columns,
  projectID,
  inProcess,
  focusedLine,
  onSelectColumns,
}: CorrelationProviderProps) {
  const getColumns = useMacrostratStore((state) => state.getColumns);

  const [store] = useState(() => {
    return create<CorrelationMapStore & ComputedStore>(
      computed((set, get): CorrelationMapStore => {
        return {
          focusedLine,
          columns: null,
          onClickMap(event: mapboxgl.MapMouseEvent, point: Point) {
            console.log("Map clicked", point);
            const state = get();
            // Check if shift key is pressed
            const shiftKeyPressed = event.originalEvent.shiftKey;
            let existingCoords = state.focusedLine?.coordinates ?? [];

            if (existingCoords.length >= 2 && !shiftKeyPressed) {
              // Reset the line to zero length
              existingCoords = [];
            }
            set({
              focusedLine: {
                type: "LineString",
                coordinates: [...existingCoords, point.coordinates],
              },
            });
          },
        };
      })
    );
  });

  // Set up the store
  /** TODO: unify handling of columns between parts of application */
  useAsyncEffect(async () => {
    let _columns = columns ?? (await getColumns(projectID, inProcess));
    store.setState({ columns: _columns, focusedLine });
  }, [projectID, inProcess, columns]);

  // Kind of an awkward way to do this but we need to allow the selector to run
  const focusedColumns = useStore(store, (state) => state.focusedColumns);
  useEffect(() => {
    onSelectColumns?.(focusedColumns, focusedLine);
  }, [focusedColumns]);

  return h(CorrelationStoreContext.Provider, { value: store }, children);
}

export function useCorrelationMapStore(
  selector: (state: CorrelationMapStore & ComputedStore) => any
) {
  const storeApi = useContext(CorrelationStoreContext);
  if (storeApi == null) {
    throw new Error("Missing CorrelationMapProvider");
  }
  return useStore(storeApi, selector);
}

function buildCorrelationColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): FocusedColumnGeoJSONRecord[] {
  if (columns == null || line == null || line.coordinates.length < 2) {
    return [];
  }
  return orderColumnsByDistance(
    computeIntersectingColumns(columns, line),
    line
  );
}

function computeIntersectingColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): ColumnGeoJSONRecord[] {
  if (columns == null || line == null) {
    return [];
  }

  return columns.filter((col) => {
    const poly = col.geometry;

    // Some in-process datasets seem to have null geometries
    if (poly == null) return false;
    if (poly.type != "Polygon" && poly.type != "MultiPolygon") return false;

    const intersection = lineIntersect(line, poly);
    return intersection.features.length > 0;
  });
}

interface FocusedColumnGeoJSONRecord extends ColumnGeoJSONRecord {
  properties: {
    centroid: Point;
    nearestPointOnLine: Point;
    distanceAlongLine: number;
  } & ColumnGeoJSONRecord["properties"];
}

function orderColumnsByDistance(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): FocusedColumnGeoJSONRecord[] {
  const centroids = columns.map((col) => centroid(col.geometry));
  const projectedPoints = centroids.map((point) =>
    nearestPointOnLine(line, point)
  );
  const distances = projectedPoints.map((point) =>
    distance(point.geometry.coordinates, line.coordinates[0])
  );

  let newColumns = columns.map((col, i) => {
    return {
      ...col,
      properties: {
        ...col.properties,
        centroid: centroids[i],
        nearestPointOnLine: projectedPoints[i],
        distanceAlongLine: distances[i],
      },
    };
  });

  return sorted(newColumns, (d) => d.properties.distanceAlongLine);
}

function sorted(data, accessor: (d) => number) {
  return data.sort((a, b) => accessor(a) - accessor(b));
}
