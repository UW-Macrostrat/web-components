/** Functions for getting the proper icon symbol for measurement features. */
import { PointSymbolName } from "./symbols";

interface PlanarOrientationData {
  dip: number;
  strike: number;
  foliation_type: string;
  foliation_defined_by?: string;
  type: string;
  facing?: string;
}

interface LinearOrientationData {
  feature_type: string;
  trend: number;
  plunge: number;
  rake_calculated?: boolean;
}

type OrientationData = PlanarOrientationData | LinearOrientationData;

interface MeasurementData {
  properties: {
    symbology: Record<string, any>;
    symbol_name?: PointSymbolName;
    orientation: OrientationData;
  };
}

export function getOrientationSymbolName(o: OrientationData): PointSymbolName {
  /** Get a symbol for a measurement based on its orientation.
   * This straightforward construction is more or less
   * equivalent to the logic in the Mapbox GL style specification above.
   */
  if (o == null) return null;

  let featureType: string | null = null;
  let symbolInclination = 0;
  let symbolBase: "bedding" | "contact" | "foliation" | "shearZone";

  if (o.hasOwnProperty("dip")) {
    const data = o as PlanarOrientationData;
    symbolInclination = data.dip;
    const { type, facing } = data;

    if (type == "planar_orientation") {
      featureType = "bedding";
    }

    if (type == "tabular_orientation") {
      featureType = "bedding";
    }

    if (type == "linear_orientation") {
      return "lineationGeneral";
    }

    if (facing == "overturned" && featureType == "bedding") {
      return "beddingOverturned";
    }
  }
  if (o.hasOwnProperty("plunge")) {
    const data = o as LinearOrientationData;
    symbolInclination = data.plunge;
    featureType = data.feature_type;
  }

  if (["fault", "fracture", "vein"].includes(featureType)) {
    return featureType as "fault" | "fracture" | "vein";
  }

  if (
    symbolInclination == 0 &&
    (featureType == "bedding" || featureType == "foliation")
  ) {
    symbolBase = featureType as "bedding" | "foliation";
    return `${symbolBase}Horizontal`;
  }
  if (
    symbolInclination > 0 &&
    symbolInclination <= 90 &&
    ["bedding", "contact", "foliation", "shear_zone"].includes(featureType)
  ) {
    if (featureType == "shear_zone") {
      symbolBase = "shearZone";
    } else {
      symbolBase = featureType as "bedding" | "contact" | "foliation";
    }

    if (symbolInclination == 90) {
      return `${symbolBase}Vertical`;
    }
    return `${symbolBase}Inclined`;
  }

  return "point";
}

export function preprocessMeasurement(
  measurement: MeasurementData
): MeasurementData {
  /**
   * Prepare a measurement for use on the map, by programmatically setting the
   * name of the appropriate orientation symbol.
   */

  measurement.properties.symbology ??= {};
  measurement.properties.symbol_name = getOrientationSymbolName(
    measurement.properties.orientation
  );

  return measurement;
}

export function getIconImage() {
  /** Get the image for a symbol using case-based logic. Taken as-is from StraboSpot codebase. Currently somewhat broken. */
  return [
    "case",
    ["has", "orientation"],
    // Variable bindings
    [
      "let",
      "symbol_orientation",
      [
        "case",
        ["has", "dip", ["get", "orientation"]],
        ["get", "dip", ["get", "orientation"]],
        [
          "case",
          ["has", "plunge", ["get", "orientation"]],
          ["get", "plunge", ["get", "orientation"]],
          0,
        ],
      ],
      [
        "let",
        "feature_type",
        ["get", "feature_type", ["get", "orientation"]],

        // Output
        [
          "case",
          // Case 1: Orientation has facing
          [
            "all",
            ["==", ["get", "facing", ["get", "orientation"]], "overturned"],
            ["any", ["==", ["var", "feature_type"], "bedding"]],
          ],
          [
            "concat",
            ["get", "feature_type", ["get", "orientation"]],
            "_overturned",
          ],
          [
            "case",
            // Case 2: Symbol orientation is 0 and feature type is bedding or foliation
            [
              "all",
              ["==", ["var", "symbol_orientation"], 0],
              [
                "any",
                ["==", ["var", "feature_type"], "bedding"],
                ["==", ["var", "feature_type"], "foliation"],
              ],
            ],
            ["concat", ["var", "feature_type"], "_horizontal"],
            [
              "case",
              // Case 3: Symbol orientation between 0-90 and feature type is bedding, contact, foliation or shear zone
              [
                "all",
                [">", ["var", "symbol_orientation"], 0],
                ["<", ["var", "symbol_orientation"], 90],
                [
                  "any",
                  ["==", ["var", "feature_type"], "bedding"],
                  ["==", ["var", "feature_type"], "contact"],
                  ["==", ["var", "feature_type"], "foliation"],
                  ["==", ["var", "feature_type"], "shear_zone"],
                ],
              ],
              ["concat", ["var", "feature_type"], "_inclined"],
              [
                "case",
                // Case 4: Symbol orientation is 90 and feature type is bedding, contact, foliation or shear zone
                [
                  "all",
                  ["==", ["var", "symbol_orientation"], 90],
                  [
                    "any",
                    ["==", ["var", "feature_type"], "bedding"],
                    ["==", ["var", "feature_type"], "contact"],
                    ["==", ["var", "feature_type"], "foliation"],
                    ["==", ["var", "feature_type"], "shear_zone"],
                  ],
                ],
                ["concat", ["var", "feature_type"], "_vertical"],
                [
                  "case",
                  // Case 5: Other features with no symbol orienation
                  [
                    "all",
                    ["has", "feature_type", ["get", "orientation"]],
                    [
                      "any",
                      ["==", ["var", "feature_type"], "fault"],
                      ["==", ["var", "feature_type"], "fracture"],
                      ["==", ["var", "feature_type"], "vein"],
                    ],
                  ],
                  ["get", "feature_type", ["get", "orientation"]],
                  [
                    "case",
                    // Defaults
                    [
                      "==",
                      ["get", "type", ["get", "orientation"]],
                      "linear_orientation",
                    ],
                    "lineation_general",
                    "default_point",
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    ],
    "default_point",
  ];
}

export function getIconImageExt() {
  /** Extension to Strabo-provided getIconImage that modifies the style tree to use programmatic definition of icon image if provided. */
  return ["case", ["has", "symbolName"], ["get", "symbolName"], getIconImage()];
}
