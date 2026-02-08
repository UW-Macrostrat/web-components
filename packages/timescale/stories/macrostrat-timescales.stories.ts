import {
  Timescale,
  TimescaleProps,
  TimescaleOrientation,
  useMacrostratIntervals,
} from "../src";
import h from "@macrostrat/hyper";

type MacrostratTimescaleProps = Omit<TimescaleProps, "intervals"> & {
  timescaleID?: number;
  rootIntervalName?: string;
};

function MacrostratTimescale(props: MacrostratTimescaleProps) {
  const { timescaleID, rootIntervalName, ...rest } = props;

  const intervals = useMacrostratIntervals({ timescaleID, rootIntervalName });

  return h(Timescale, {
    intervals,
    ...rest,
  });
}

export default {
  title: "Timescale/Macrostrat timescale",
  component: MacrostratTimescale,
};

export const CustomTimescale = {
  args: {
    timescaleID: 1,
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
  },
};

export const MartianEpochs = {
  args: {
    rootIntervalName: "Martian epochs",
    timescaleID: 28,
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
  },
};

export const Horizontal = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: false,
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
