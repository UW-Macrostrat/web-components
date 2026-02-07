import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";
import chroma from "chroma-js";

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

export const VerticalWithRotatedLabels = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
    rotateLabels: true,
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

export const Condensed = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [2, 4],
    absoluteAgeScale: true,
    length: 800,
    ageRange: [1000, 0],
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
