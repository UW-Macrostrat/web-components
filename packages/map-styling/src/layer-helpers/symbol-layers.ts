const lineSymbols = [
  "anticline-hinge",
  "left-lateral-fault",
  "normal-fault",
  "reverse-fault",
  "right-lateral-fault",
  "syncline-hinge",
  "thrust-fault",
];

const spacing = {
  "anticline-hinge": 200,
  "syncline-hinge": 200,
  "thrust-fault": [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    0, // stop
    5, // size
    15,
    80,
    24,
    200,
  ],
};

// Bad sources
// id: 225

function symbolLayerPaintProperties(lyr: string, opts: any = {}) {
  const { color = "#000000", reverse = false, rotate } = opts;
  let offset: any = [0, 0];
  if (lyr == "thrust-fault") {
    offset = [
      "interpolate",
      ["exponential", 2],
      ["zoom"],
      0,
      ["literal", [0, 0]],
      24,
      ["literal", [0, 0]]
    ];
  }

  return {
    type: "symbol",
    layout: {
      "icon-image": lyr,
      "icon-pitch-alignment": "map",
      "icon-allow-overlap": true,
      "symbol-avoid-edges": false,
      "symbol-placement": "line",
      "symbol-spacing": spacing[lyr] ?? 30,
      "icon-offset": offset,
      "icon-rotate": rotate ?? (reverse ? 180 : 0),
      "icon-size": [
        "interpolate",
        ["exponential", 2],
        ["zoom"],
        0, // stop
        0.5,
        15,
        1.2, // size
        18,
        4,
        24,
        30
      ]
    },
    paint: {
      "icon-color": color
    }
  };
}

function createLineSymbolLayers() {
  let symbolLayers = [];
  for (const lyr of lineSymbols) {
    let color: any = ["get", "color"];
    if (lyr == "thrust-fault") {
      color = "#000000";
    }

    const val = {
      id: `${lyr}-stroke`,
      source: "geology",
      "source-layer": "contact",
      filter: ["==", ["get", "type"], lyr],
      ...symbolLayerPaintProperties(lyr, color)
    };

    symbolLayers.push(val);
  }
  return symbolLayers;
}

export { lineSymbols, createLineSymbolLayers, symbolLayerPaintProperties };
