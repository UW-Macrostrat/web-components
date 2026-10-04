import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";
import chroma from "chroma-js";
import { scaleLinear } from "@visx/scale";

export default {
  title: "Timescale/Timescale",
  component: Timescale,
};

export const Vertical = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
  },
};

export const VerticalAbsolute = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [1, 3],
    absoluteAgeScale: true,
    length: 800,
  },
};

export const VerticalFilteredToAgeRange = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [1, 3],
    ageRange: [750, 500],
    absoluteAgeScale: true,
    style: {
      width: 150,
    },
    length: 500,
  },
};

export const VerticalWithRotatedLabels = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
    rotateLabels: true,
  },
};

export const VerticalWithRotatedLabelsConstrained = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [1, 5],
    rotateLabels: true,
    style: {
      width: 200,
    },
  },
};

export const Horizontal = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: false,
    onClick: (e, interval) => {
      console.log("Clicked interval:", interval);
    },
  },
};

export const HorizontalWithRotatedLabels = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: false,
    rotateLabels: true,
    onClick: (e, interval) => {
      console.log("Clicked interval:", interval);
    },
  },
};

export const HorizontalAbsolute = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: true,
    length: 2500,
  },
};

export const HorizontalAbsoluteCondensed = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [2, 4],
    absoluteAgeScale: true,
    length: 800,
    ageRange: [1000, 0],
  },
};

export const HorizontalAbsoluteSuperCondensed = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: true,
    length: 1000,
  },
};

/** Phanerozoic on an externally supplied scale: interval widths follow age. */
export const HorizontalWithScale = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [1, 4],
    ageRange: [541, 0],
    scale: scaleLinear({ domain: [541, 0], range: [0, 1200] }),
  },
};

export const WithRecoloredIntervals = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [1, 3],
    intervalStyle(interval) {
      return {
        backgroundColor: chroma(interval.col)
          .set("hsl.l", 0.9)
          .set("hsl.s", 0.3)
          .hex(),
        color: chroma(interval.col).set("hsl.l", 0.1).css(),
      };
    },
  },
};
