import { useMapStyleOperator, useOverlayStyle } from "@macrostrat/mapbox-react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { FeatureCollection } from "geojson";
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
  data: FeatureCollection | GeoJSONFeature[],
): FeatureCollection {
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
  const isSelected = ["boolean", ["feature-state", "selected"], false];
  const isHovered = ["boolean", ["feature-state", "hover"], false];
  // If color is in the feature state or geojson properties, use that as second choice
  if (typeof columnColor === "string") {
    columnColor = [
      "coalesce",
      ["feature-state", "color"],
      ["get", "color"],
      ["case", isSelected, columnSelectedColor, columnColor],
    ];
  }

  const fillOpacity = opts.opacity ?? [
    "case",
    isSelected,
    0.5,
    isHovered,
    0.3,
    0.1,
  ];

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
          "line-color": [
            "case",
            ["any", isSelected, isHovered],
            columnSelectedColor,
            lineColor,
          ],
          "line-width": lineWidth,
          "line-opacity": [
            "case",
            ["any", isSelected, isHovered],
            1.0,
            lineOpacity,
          ],
        },
      },
    ],
  };
}
