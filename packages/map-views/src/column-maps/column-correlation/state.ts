import { LineString, Point } from "geojson";
import { create, StoreApi, useStore } from "zustand";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
// Turf intersection
import { lineIntersect } from "@turf/line-intersect";
import distance from "@turf/distance";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { centroid } from "@turf/centroid";
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import { createComputed } from "zustand-computed";
import { useMacrostratColumns } from "@macrostrat/data-provider";
import { buffer } from "@turf/buffer";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import {
  createScopedStore,
  ZustandStoreProvider,
} from "@macrostrat/scoped-store";

export type CorrelationSelectionMode = "line" | "manual";

export interface CorrelationMapInput {
  columns: ColumnGeoJSONRecord[];
  focusedLine: LineString | null;
  /** When set, columns are selected manually (by clicking) in this order,
   * rather than derived from a line of section. */
  manualColumns?: number[] | null;
}

export interface CorrelationMapStore extends CorrelationMapInput {
  onClickMap: (event: mapboxgl.MapMouseEvent, point: Point) => void;
  /** Toggle a column in/out of the manual selection (used in "manual" mode) */
  toggleColumn: (colID: number) => void;
  /** Remove a column from the selection. In "line" mode this converts the
   * current selection to a manual one (a line can't represent an arbitrary
   * subset), so removing a column switches modes. */
  removeColumn: (colID: number) => void;
  /** Replace the manual column selection with an explicit ordered list (used
   * e.g. for drag-and-drop reordering). Switches to manual mode. */
  setManualColumns: (colIDs: number[]) => void;
  setHoveredColumn: (colID: number | null) => void;
  hoveredColumn: number | null;
  /** Request the map to frame a particular column (e.g. on header click). */
  zoomToColumn: (colID: number | null) => void;
  zoomColumn: number | null;
  /** Incremented on each zoom request so repeat clicks re-frame the column. */
  zoomNonce: number;
  projectID?: number;
}

export interface CorrelationProviderProps extends CorrelationMapInput {
  projectID?: number;
  inProcess?: boolean;
  columns: ColumnGeoJSONRecord[] | null;
  children: ReactNode;
  onSelectColumns?: (
    columns: FocusedColumnGeoJSONRecord[],
    line: LineString | null,
  ) => void;
}

const CorrelationStoreContext =
  createContext<StoreApi<CorrelationMapStore> | null>(null);

type ComputedStore = {
  focusedColumns: FocusedColumnGeoJSONRecord[];
  selectionMode: CorrelationSelectionMode;
};

/** A computed store that will automatically update when the state changes */
const computed = createComputed((state: CorrelationMapStore): ComputedStore => {
  const manual = state.manualColumns != null;
  console.log(state.manualColumns, state.focusedLine);
  return {
    selectionMode: manual ? "manual" : "line",
    // Focused columns are derived either from an explicit manual selection or
    // from the columns intersecting the line of section.
    focusedColumns: manual
      ? buildManualColumns(state.columns, state.manualColumns)
      : buildCorrelationColumns(state.columns, state.focusedLine),
  };
}) as any;

export function ColumnCorrelationProvider({
  children,
  columns,
  projectID,
  inProcess,
  focusedLine,
  manualColumns = null,
  onSelectColumns,
}: CorrelationProviderProps) {
  const initializeStore = (set, get): CorrelationMapStore => {
    return {
      focusedLine,
      manualColumns,
      hoveredColumn: null,
      zoomColumn: null,
      zoomNonce: 0,
      projectID,
      columns: null,
      onClickMap(event: mapboxgl.MapMouseEvent, point: Point) {
        const state = get();
        // In manual-selection mode the map click is handled per-column
        if (state.manualColumns != null) return;
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
      toggleColumn(colID: number) {
        const state = get();
        const current =
          state.manualColumns ??
          state.focusedColumns.map((d) => d.properties.col_id);
        const next = current.includes(colID)
          ? current.filter((d) => d !== colID)
          : [...current, colID];
        set({ manualColumns: next, focusedLine: null });
      },
      removeColumn(colID: number) {
        const state = get();
        // Seed from the current selection (line-derived or manual)
        const current =
          state.manualColumns ??
          state.focusedColumns.map((d) => d.properties.col_id);
        set({
          manualColumns: current.filter((d) => d !== colID),
          focusedLine: null,
        });
      },
      setManualColumns(colIDs: number[]) {
        set({ manualColumns: colIDs, focusedLine: null });
      },
      setHoveredColumn(colID: number | null) {
        set({ hoveredColumn: colID });
      },
      zoomToColumn(colID: number | null) {
        set({ zoomColumn: colID, zoomNonce: get().zoomNonce + 1 });
      },
    };
  };
  const [store] = useState(() => {
    return create<CorrelationMapStore & ComputedStore>(
      computed(initializeStore),
    );
  });
  return h(CorrelationStoreContext.Provider, { value: store }, [
    h(_StoreEffects, { store, projectID, inProcess, onSelectColumns }),
    children,
  ]);
}

function _StoreEffects({ store, projectID, inProcess, onSelectColumns }) {
  // Set up the store
  /** TODO: move the fetching of all columns to within the map */
  const _columns = useMacrostratColumns(projectID, inProcess);
  useEffect(() => {
    if (_columns != null) {
      store.setState({ columns: _columns });
    }
  }, [_columns]);

  // Kind of an awkward way to do this but we need to allow the selector to run
  const focusedColumns = useStore(
    store,
    (state: CorrelationMapStore) => state.focusedColumns,
  );
  const _focusedLine = useStore(
    store,
    (state: CorrelationMapStore) => state.focusedLine,
  );

  useEffect(() => {
    onSelectColumns?.(focusedColumns, _focusedLine);
  }, [focusedColumns, _focusedLine]);

  return null;
}

export function useCorrelationMapStore(
  selector: (state: CorrelationMapStore & ComputedStore) => any,
) {
  const storeApi = useContext(CorrelationStoreContext);
  if (storeApi == null) {
    throw new Error("Missing CorrelationMapProvider");
  }
  return useStore(storeApi, selector);
}

export interface ColumnMapLink {
  onColumnMouseOver: (colID: number | null) => void;
  onColumnClick: (colID: number) => void;
}

/** Wire a correlation chart's column-level events to the correlation map:
 * hovering a column highlights it on the map, and clicking a column header
 * frames it. Spread the result into `CorrelationChart`. Must be used within a
 * `ColumnCorrelationProvider`. */
export function useColumnMapLink(): ColumnMapLink {
  const setHoveredColumn = useCorrelationMapStore((s) => s.setHoveredColumn);
  const zoomToColumn = useCorrelationMapStore((s) => s.zoomToColumn);
  return {
    onColumnMouseOver: setHoveredColumn,
    onColumnClick: zoomToColumn,
  };
}

function buildCorrelationColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString,
): FocusedColumnGeoJSONRecord[] {
  if (columns == null || line == null || line.coordinates.length < 2) {
    return [];
  }
  return orderColumnsByDistance(
    computeIntersectingColumns(columns, line),
    line,
  );
}

function buildManualColumns(
  columns: ColumnGeoJSONRecord[],
  ids: number[],
): FocusedColumnGeoJSONRecord[] {
  /** Build focused columns from an explicit, ordered list of column IDs. The
   * ordering line simply connects them in the order they were selected. */
  if (columns == null || ids == null) return [];
  const byID = new Map(columns.map((c) => [c.properties.col_id, c]));
  const result: FocusedColumnGeoJSONRecord[] = [];
  ids.forEach((id, i) => {
    const col = byID.get(id);
    if (col == null) return;
    const c = centroid(col.geometry);
    result.push({
      ...col,
      properties: {
        ...col.properties,
        centroid: c,
        nearestPointOnLine: c,
        distanceAlongLine: i,
      },
    });
  });
  return result;
}

function computeIntersectingColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString,
): ColumnGeoJSONRecord[] {
  if (columns == null || line == null) {
    return [];
  }

  /** eODP-focused process. Find buffers around line and then find columns intersecting that buffer */
  const bufferedLine = buffer(line, 1, { units: "degrees" });

  const nearbyPoints = columns.filter((col) => {
    if (col.geometry?.type != "Point") {
      return false;
    }
    return booleanPointInPolygon(col.geometry, bufferedLine);
  });

  const intersectingPolygons = columns.filter((col) => {
    const poly = col.geometry;

    // Some in-process datasets seem to have null geometries
    if (poly == null) return false;
    if (poly.type != "Polygon" && poly.type != "MultiPolygon") return false;

    const intersection = lineIntersect(line, poly);
    return intersection.features.length > 0;
  });

  return [...intersectingPolygons, ...nearbyPoints];
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
  line: LineString,
): FocusedColumnGeoJSONRecord[] {
  const centroids = columns.map((col) => centroid(col.geometry));
  const projectedPoints = centroids.map((point) =>
    nearestPointOnLine(line, point),
  );
  const distances = projectedPoints.map((point) =>
    distance(point.geometry.coordinates, line.coordinates[0]),
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
