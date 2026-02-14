import { useMapStyleOperator, useOverlayStyle } from "@macrostrat/mapbox-react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import GeoJSON, { FeatureCollection } from "geojson";
import { GeoJSONFeature } from "mapbox-gl";
import { getCSSVariable } from "@macrostrat/color-utils";
import { buildGeoJSONSource } from "@macrostrat/mapbox-utils";
import { StyleFragment } from "@macrostrat/mapbox-react";

export interface ColumnsStyleOptions {
  color?: string | any[];
  selectedColor?: string | any[];
  opacity?: number | any[];
  circleRadius?: number | any[];
  lineOpacity?: number | any[];
  lineWidth?: number | any[];
  lineColor?: string | any[];
}

interface ColumnLayerOptions extends ColumnsStyleOptions {
  enabled: boolean;
  columns: FeatureCollection | GeoJSONFeature[];
}

export function BaseColumnsLayer({
  enabled = true,
  columns,
  ...rest
}: ColumnLayerOptions) {
  useOverlayStyle(() => (enabled ? buildColumnsStyle(rest) : null), [enabled]);

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }

      setGeoJSON(map, "columns", promoteToFeatureCollection(columns));
    },
    [columns, enabled],
  );
  return null;
}

function promoteToFeatureCollection(
  data: FeatureCollection | GeoJSONFeature | GeoJSONFeature[] | null,
): FeatureCollection | null {
  if (data == null) return null;
  if ("type" in data && data.type == "Feature") {
    return {
      type: "FeatureCollection",
      features: [data],
    };
  }
  if (
    "type" in data &&
    data.type == "FeatureCollection" &&
    "features" in data
  ) {
    return data;
  }
  return {
    type: "FeatureCollection",
    features: data,
  };
}

export function buildColumnsStyle(
  opts: ColumnsStyleOptions = {},
): StyleFragment {
  const { color } = opts;
  const columnBaseColor =
    color ?? getCSSVariable("--text-subtle-color", "black");
  let columnColor: any = columnBaseColor;
  const columnSelectedColor =
    opts.selectedColor ?? getCSSVariable("--selection-color", "purple");

  const lineColor = opts.lineColor ?? columnBaseColor;
  const isHovered = ["boolean", ["feature-state", "hover"], false];
  // If color is in the feature state or geojson properties, use that as second choice
  if (typeof columnColor === "string") {
    columnColor = [
      "coalesce",
      ["feature-state", "color"],
      ["get", "color"],
      columnColor,
    ];
  }

  const fillOpacity = opts.opacity ?? 0.1;

  const lineOpacity = opts.lineOpacity ?? 0.5;
  const lineWidth = opts.lineWidth ?? 2;

  const circleRadius = opts.circleRadius ?? 4;

  return {
    sources: {
      columns: buildGeoJSONSource(),
    },
    version: 8,
    layers: [
      {
        id: "columns-fill",
        type: "fill",
        source: "columns",
        paint: {
          "fill-color": columnColor,
          "fill-opacity": fillOpacity,
        },
      },
      {
        id: "columns-points",
        type: "circle",
        source: "columns",
        paint: {
          "circle-radius": circleRadius,
          "circle-color": columnColor,
          "circle-opacity": fillOpacity,
        },
        filter: ["==", "$type", "Point"],
      },
      {
        id: "columns-line",
        type: "line",
        source: "columns",
        paint: {
          "line-color": ["case", isHovered, columnSelectedColor, lineColor],
          "line-width": lineWidth,
          "line-opacity": ["case", isHovered, 1.0, lineOpacity],
        },
      },
    ],
  };
}

export type ColumnFeature = GeoJSON.Feature & { id: number };

const selectedColumnSourceID = "selectedColumn";

export function SelectedColumnOverlay({
  selectedColumn,
  ...styleOpts
}: { selectedColumn: ColumnFeature | null } & SelectedColumnStyleOpts) {
  useOverlayStyle(() => buildSelectedColumnStyle(styleOpts), []);

  useMapStyleOperator(
    (map) => {
      setGeoJSON(
        map,
        selectedColumnSourceID,
        promoteToFeatureCollection(selectedColumn as GeoJSONFeature | null),
      );
    },
    [selectedColumn],
  );

  return null;
}

interface SelectedColumnStyleOpts {
  color?: string | any[];
}

function buildSelectedColumnStyle(
  opts: SelectedColumnStyleOpts = {},
): StyleFragment {
  const columnSelectedColor: any =
    opts.color ?? getCSSVariable("--selection-color", "purple");

  return {
    sources: {
      selectedColumn: buildGeoJSONSource(),
    },
    version: 8,
    layers: [
      {
        id: "selected-column-highlight",
        type: "fill",
        source: selectedColumnSourceID,
        paint: {
          "fill-color": columnSelectedColor,
          "fill-opacity": 0.5,
        },
        filter: ["==", "$type", "Polygon"],
      },
      {
        id: "selected-column-edge",
        type: "line",
        source: selectedColumnSourceID,
        paint: {
          "line-color": columnSelectedColor,
          "line-width": 2,
          "line-opacity": 1.0,
        },
        filter: ["==", "$type", "Polygon"],
      },
      {
        id: "selected-column-point",
        type: "circle",
        source: selectedColumnSourceID,
        paint: {
          "circle-radius": 6,
          "circle-color": columnSelectedColor,
          "circle-opacity": 1.0,
        },
        filter: ["==", "$type", "Point"],
      },
    ],
  };
}
