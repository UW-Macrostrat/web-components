import { getCSSVariable } from "@macrostrat/color-utils";
import { buildGeoJSONSource } from "@macrostrat/mapbox-utils";
import type { Style } from "mapbox-gl";

export function buildColumnsStyle(color: string): Style {
  let columnColor: any =
    color ?? getCSSVariable("--text-subtle-color", "black");
  const columnSelectedColor = getCSSVariable("--selection-color", "purple");

  // If color is in the feature state or geojson properties, use that as second choice

  columnColor = [
    "coalesce",
    ["feature-state", "color"],
    ["get", "color"],
    columnColor,
  ];

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
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.5,
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0.1,
          ],
        },
      },
      {
        id: "columns-line",
        type: "line",
        source: "columns",
        paint: {
          "line-color": columnColor,
          "line-width": 2,
          "line-opacity": 0.5,
        },
      },
      {
        id: "columns-points",
        type: "circle",
        source: "columns",
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            columnSelectedColor,
            columnColor,
          ],
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1,
            ["boolean", ["feature-state", "hover"], false],
            0.7,
            0.5,
          ],
        },
        filter: ["==", "$type", "Point"],
      },
    ],
  };
}
