export const sharedColumnArgTypes = {
  columnID: {
    control: {
      type: "number",
    },
  },
  selectedUnit: {
    control: {
      type: "number",
    },
  },
  t_age: {
    control: {
      type: "number",
    },
  },
  b_age: {
    control: {
      type: "number",
    },
  },
  unconformityLabels: {
    options: ["minimal", "prominent", "none"],
    control: { type: "radio" },
  },
  axisType: {
    options: ["age", "ordinal", "depth"],
    control: { type: "radio" },
  },
  mergeSections: {
    options: ["all", "overlapping", null],
    control: { type: "radio" },
  },
  pixelScale: {
    control: {
      type: "number",
    },
  },
  collapseSmallUnconformities: {
    control: {
      type: "boolean",
    },
  },
  minSectionHeight: {
    control: {
      type: "number",
    },
  },
  targetUnitHeight: {
    control: {
      type: "number",
    },
  },
  showLabelColumn: {
    control: {
      type: "boolean",
    },
  },
  maxInternalColumns: {
    control: {
      type: "number",
    },
  },
};
