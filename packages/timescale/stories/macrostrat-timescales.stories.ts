import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";
import { useAPIResult } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

type MacrostratTimescaleProps = Omit<TimescaleProps, "intervals"> & {
  timescaleID?: number;
};

function MacrostratTimescale(props: TimescaleProps) {
  const { timescaleID, ...rest } = props;

  const intervals = useAPIResult("/defs/intervals", {
    timescale_id: timescaleID,
  });

  return h(Timescale, {
    intervals,
    ...rest,
  });
}

export default {
  title: "Timescale/Macrostrat timescale",
  component: MacrostratTimescale,
};

export const Vertical = {
  args: {
    orientation: TimescaleOrientation.VERTICAL,
    levels: [0, 5],
    timescaleID: 1,
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
