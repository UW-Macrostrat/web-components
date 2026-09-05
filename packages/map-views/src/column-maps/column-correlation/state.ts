/** State for the column correlation map: the column footprints, the current
 * selection (a line of section or an explicit, ordered list of columns), hover
 * and framing requests, and the derived set of focused columns.
 *
 * A plain `zustand` store holds the base state and actions, mounted through
 * `@macrostrat/scoped-store`'s `ZustandStoreProvider` so that it is also
 * reachable from jotai (`zustandStoreAtom`). Derived values — the focused
 * columns and the selection mode — are jotai atoms selecting into that store,
 * so they recompute only when their inputs change and notify only when their
 * value does. This replaces `zustand-computed`, whose 2.1.1 release mutates
 * state in place inside `setState` and silently stopped notifying subscribers.
 */
import { LineString, Point } from "geojson";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
// Turf intersection
import { lineIntersect } from "@turf/line-intersect";
import distance from "@turf/distance";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { centroid } from "@turf/centroid";
import { ReactNode, useEffect } from "react";
import h from "@macrostrat/hyper";
import { useMacrostratColumns } from "@macrostrat/data-provider";
import { buffer } from "@turf/buffer";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import {
  atom,
  createScopedStore,
  useZustandSelector,
  useZustandStoreAPI,
  ZustandStoreProvider,
  zustandStoreAtom,
} from "@macrostrat/scoped-store";

export type CorrelationSelectionMode = "line" | "manual";

export interface CorrelationMapInput {
  columns: ColumnGeoJSONRecord[] | null;
  focusedLine: LineString | null;
  /** When set, columns are selected manually (by clicking) in this order,
   * rather than derived from a line of section. */
  selectedColumns?: number[] | null;
}

/** The zustand store: base state and actions. */
export interface CorrelationMapStore extends CorrelationMapInput {
  columns: ColumnGeoJSONRecord[];
  onClickMap: (event: mapboxgl.MapMouseEvent, point: Point) => void;
  /** Toggle a column in/out of the manual selection (used in "manual" mode) */
  toggleColumn: (colID: number) => void;
  /** Remove a column from the selection. In "line" mode this converts the
   * current selection to a manual one (a line can't represent an arbitrary
   * subset), so removing a column switches modes. */
  removeColumn: (colID: number) => void;
  /** Replace the manual column selection with an explicit ordered list (used
   * e.g. for drag-and-drop reordering). Switches to manual mode. */
  setSelectedColumns: (colIDs: number[]) => void;
  /** Switch modes explicitly: to `manual`, seeding the list with the columns
   * currently focused; to `line`, clearing the selection so a new line of
   * section can be drawn. */
  setSelectionMode: (mode: CorrelationSelectionMode) => void;
  setHoveredColumn: (colID: number | null) => void;
  hoveredColumn: number | null;
  /** Request the map to frame a particular column (e.g. on header click). */
  zoomToColumn: (colID: number | null) => void;
  zoomColumn: number | null;
  /** Incremented on each zoom request so repeat clicks re-frame the column. */
  zoomNonce: number;
  projectID?: number;
}

/** Values derived from the store, available through atoms and the selector
 * shim alike. */
export interface CorrelationMapDerived {
  focusedColumns: FocusedColumnGeoJSONRecord[];
  selectionMode: CorrelationSelectionMode;
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

/** The isolation holding one correlation map's store and atoms. */
export const correlationMapScope = createScopedStore();
const ctx = correlationMapScope;

/* ----------------------------------------------------- selection atoms */

/** The store's state, as jotai sees it. */
const storeAtom = atom((get) => get(zustandStoreAtom) as CorrelationMapStore);

// Base fields, so derived atoms depend on exactly what they read: a hover or
// a zoom request changes the store but none of these.
export const correlationColumnsAtom = atom((get) => get(storeAtom).columns);
export const focusedLineAtom = atom((get) => get(storeAtom).focusedLine);
export const selectedColumnsAtom = atom(
  (get) => get(storeAtom).selectedColumns ?? null,
);
export const hoveredColumnAtom = atom((get) => get(storeAtom).hoveredColumn);

export const selectionModeAtom = atom<CorrelationSelectionMode>((get) => {
  if (get(selectedColumnsAtom) != null) return "manual";
  return "line";
});

/** Focused columns come either from the explicit manual selection or from the
 * columns intersecting the line of section, ordered along it. */
export const focusedColumnsAtom = atom<FocusedColumnGeoJSONRecord[]>((get) =>
  resolveFocusedColumns(
    get(correlationColumnsAtom),
    get(selectedColumnsAtom),
    get(focusedLineAtom),
  ),
);

/* ------------------------------------------------------------ provider */

export function ColumnCorrelationProvider({
  children,
  columns,
  projectID,
  inProcess,
  focusedLine,
  selectedColumns = null,
  onSelectColumns,
}: CorrelationProviderProps) {
  const initializeStore = (set, get): CorrelationMapStore => {
    // The selection as ids, whichever mode produced it
    const currentSelection = (): number[] => {
      const state: CorrelationMapStore = get();
      if (state.selectedColumns != null) return state.selectedColumns;
      return resolveFocusedColumns(
        state.columns,
        null,
        state.focusedLine,
      ).map((d) => d.properties.col_id);
    };

    return {
      focusedLine: focusedLine ?? null,
      selectedColumns,
      hoveredColumn: null,
      zoomColumn: null,
      zoomNonce: 0,
      projectID,
      columns: columns ?? [],
      onClickMap(event: mapboxgl.MapMouseEvent, point: Point) {
        const state: CorrelationMapStore = get();
        // In manual-selection mode the map click is handled per-column
        if (state.selectedColumns != null) return;
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
        const current = currentSelection();
        let next: number[];
        if (current.includes(colID)) {
          next = current.filter((d) => d !== colID);
        } else {
          next = [...current, colID];
        }
        set({ selectedColumns: next, focusedLine: null });
      },
      removeColumn(colID: number) {
        set({
          selectedColumns: currentSelection().filter((d) => d !== colID),
          focusedLine: null,
        });
      },
      setSelectedColumns(colIDs: number[]) {
        set({ selectedColumns: colIDs, focusedLine: null });
      },
      setSelectionMode(mode: CorrelationSelectionMode) {
        const state: CorrelationMapStore = get();
        const isManual = state.selectedColumns != null;
        if (mode === "manual" && !isManual) {
          set({ selectedColumns: currentSelection(), focusedLine: null });
        } else if (mode === "line" && isManual) {
          set({ selectedColumns: null, focusedLine: null });
        }
      },
      setHoveredColumn(colID: number | null) {
        set({ hoveredColumn: colID });
      },
      zoomToColumn(colID: number | null) {
        set({ zoomColumn: colID, zoomNonce: get().zoomNonce + 1 });
      },
    };
  };

  // `inherit: false`: each provider owns its store, so two maps on a page don't
  // share a selection and a remount reseeds from props. (Inheriting resolves to
  // jotai's default store and hydrates once per document, which made a second
  // mount reuse the first mount's store.)
  return h(
    ZustandStoreProvider,
    {
      ctx,
      initializeStore,
      inherit: false,
      debugName: "Correlation map store",
    },
    [h(_StoreEffects, { projectID, inProcess, onSelectColumns }), children],
  );
}

function _StoreEffects({ projectID, inProcess, onSelectColumns }) {
  const store = useZustandStoreAPI<CorrelationMapStore>(ctx);

  /** TODO: move the fetching of all columns to within the map */
  const _columns = useMacrostratColumns(projectID, inProcess);
  useEffect(() => {
    if (_columns != null) {
      store.setState({ columns: _columns });
    }
  }, [_columns]);

  const focusedColumns = useFocusedColumns();
  const focusedLine = ctx.useValue(focusedLineAtom);
  useEffect(() => {
    onSelectColumns?.(focusedColumns, focusedLine);
  }, [focusedColumns, focusedLine]);

  return null;
}

/* --------------------------------------------------------------- hooks */

/** The focused columns, recomputed only when the footprints, the selection or
 * the line change. */
export function useFocusedColumns(): FocusedColumnGeoJSONRecord[] {
  return ctx.useValue(focusedColumnsAtom);
}

export function useSelectionMode(): CorrelationSelectionMode {
  return ctx.useValue(selectionModeAtom);
}

/** The store API, for imperative access (`getState`, `setState`). */
export function useCorrelationMapStoreAPI() {
  return useZustandStoreAPI<CorrelationMapStore>(ctx);
}

/** Selector-style access to the store, base fields and derived values alike.
 * Base fields subscribe through zustand's selector equality; the derived
 * values arrive from their atoms, so selecting them costs nothing extra. */
export function useCorrelationMapStore<T = any>(
  selector: (state: CorrelationMapStore & CorrelationMapDerived) => T,
): T {
  const focusedColumns = useFocusedColumns();
  const selectionMode = useSelectionMode();
  return useZustandSelector<CorrelationMapStore, T>(ctx, (state) =>
    selector({ ...state, focusedColumns, selectionMode }),
  );
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

/* ------------------------------------------------------------- helpers */

function resolveFocusedColumns(
  columns: ColumnGeoJSONRecord[],
  selected: number[] | null,
  line: LineString | null,
): FocusedColumnGeoJSONRecord[] {
  if (selected != null) {
    return buildManuallySelectedColumns(columns, selected);
  }
  if (line != null) {
    return buildCorrelationColumns(columns, line);
  }
  return [];
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

function buildManuallySelectedColumns(
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

export interface FocusedColumnGeoJSONRecord extends ColumnGeoJSONRecord {
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
