import { LineString, Point } from "geojson";
import { create } from "zustand";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
// Turf intersection
import { lineIntersect } from "@turf/line-intersect";
import distance from "@turf/distance";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { centroid } from "@turf/centroid";
import mapboxgl from "mapbox-gl";

export interface CorrelationMapInput {
  columns: ColumnGeoJSONRecord[];
  focusedLine: LineString | null;
}

export interface CorrelationMapState extends CorrelationMapInput {
  focusedColumns: FocusedColumnGeoJSONRecord[];
  onClickMap: (event: mapboxgl.MapMouseEvent, point: Point) => void;
  startup: (startup: CorrelationMapInput) => Promise<void>;
}

export interface CorrelationMapProps extends CorrelationMapInput {
  onSelectColumns: (
    columns: FocusedColumnGeoJSONRecord[],
    line: LineString | null
  ) => void;
}

/** Store management with Zustand.
 * This is a newer and somewhat more subtle approach than the Redux store
 * used in the mapping application.
 * */
export const useCorrelationMapStore = create<CorrelationMapState>(
  (set, get) => {
    return {
      focusedLine: null,
      columns: [],
      columnUnits: [],
      focusedColumns: [],
      onClickMap(event: mapboxgl.MapMouseEvent, point: Point) {
        const state = get();

        // Check if shift key is pressed
        const shiftKeyPressed = event.originalEvent.shiftKey;

        console.log("Shift key pressed: ", shiftKeyPressed);

        if (
          state.focusedLine == null ||
          (state.focusedLine.coordinates.length >= 2 && !shiftKeyPressed)
        ) {
          return set({
            focusedLine: {
              type: "LineString",
              coordinates: [point.coordinates],
            },
            focusedColumns: [],
          });
        }
        const focusedLine: LineString = {
          type: "LineString",
          coordinates: [...state.focusedLine.coordinates, point.coordinates],
        };

        const columns = buildCorrelationColumns(state.columns, focusedLine);

        set({
          focusedLine,
          focusedColumns: columns,
        });
      },
      async startup({ columns = [], focusedLine = null }) {
        console.log("Booting up map store", columns, focusedLine);
        set({ columns, focusedLine });
        const focusedColumns = buildCorrelationColumns(columns, focusedLine);
        set({ focusedColumns });
      },
    };
  }
);

function buildCorrelationColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): FocusedColumnGeoJSONRecord[] {
  let features = [];
  if (columns == null && line == null) {
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
