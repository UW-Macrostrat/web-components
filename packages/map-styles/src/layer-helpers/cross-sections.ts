import { getCSSVariable } from "@macrostrat/color-utils";
import type { AnyLayer } from "mapbox-gl";

export function buildCrossSectionLayers(): AnyLayer[] {
  /** Build standardized layers for cross-sections */
  const ruleColor = getCSSVariable(
    "--panel-background-color",
    "#f0f0f0", // Fallback to a default color if the variable is not set
  );

  const centerColor = getCSSVariable(
    "--panel-rule-color",
    "#4bc0c0", // Fallback to a default color if the variable is not set
  );

  const crossSectionPointPaint = {
    "circle-radius": {
      stops: [
        [0, 3],
        [12, 5],
      ],
    },
    "circle-color": centerColor,
    "circle-stroke-width": {
      stops: [
        [0, 2],
        [12, 4],
      ],
    },
    "circle-stroke-color": ruleColor,
  };

  return [
    {
      id: "crossSectionLine",
      type: "line",
      source: "crossSectionLine",
      paint: {
        "line-width": {
          stops: [
            [0, 1],
            [12, 3],
          ],
        },
        "line-color": ruleColor,
        "line-opacity": 1,
      },
    },
    {
      id: "crossSectionEndpoint",
      type: "circle",
      source: "crossSectionEndpoints",
      paint: crossSectionPointPaint,
    },
    {
      id: "elevationMarker",
      type: "circle",
      source: "elevationMarker",
      paint: {
        ...crossSectionPointPaint,
        "circle-color": "#4bc0c0",
      },
    },
  ];
}
