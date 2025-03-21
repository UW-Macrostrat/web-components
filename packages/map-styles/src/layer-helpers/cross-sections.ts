export function buildCrossSectionLayers(): mapboxgl.Layer[] {
  /** Build standardized layers for cross-sections */
  const ruleColor = getComputedStyle(document.body).getPropertyValue(
    "--panel-background-color"
  );

  const centerColor = getComputedStyle(document.body).getPropertyValue(
    "--panel-rule-color"
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
