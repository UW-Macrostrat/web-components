import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";

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
