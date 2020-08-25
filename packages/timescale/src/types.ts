import { ScaleLinear } from "d3-scale";

interface Interval {
  nam: string;
  oid: number;
  pid: number | null;
  lvl: number;
  col: string;
  lag: number;
  eag: number;
}

interface NestedInterval extends Interval {
  children: Interval[];
}

type IntervalMap = Map<number, Interval[]>;

enum TimescaleOrientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

interface TimescaleProviderProps {
  timescale: NestedInterval;
  selectedInterval: Interval | null;
  parentMap: IntervalMap;
  ageRange: [number, number];
  length: number;
  orientation: TimescaleOrientation;
}

interface TimescaleCTX extends TimescaleProviderProps {
  scale: ScaleLinear<number, number> | null;
}

export {
  TimescaleCTX,
  Interval,
  NestedInterval,
  IntervalMap,
  TimescaleOrientation,
};
