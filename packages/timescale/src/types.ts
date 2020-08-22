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

interface TimescaleCTX {
  timescale: NestedInterval;
  selectedInterval: Interval | null;
  parentMap: IntervalMap;
  scale: ScaleLinear<number, number>;
}

export { TimescaleCTX, Interval, NestedInterval, IntervalMap };
