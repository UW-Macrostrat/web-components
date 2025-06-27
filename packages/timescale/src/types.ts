import { ScaleLinear } from "d3-scale";

export interface Interval {
  pid: number | null;
  oid: number;
  lvl: number;
  eag: number;
  lag: number;
  col: string;
  nam: string;
  typ?: string;
  rid?: number[];
  abr?: string;
  int_id?: number; 
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
  levels: [number, number] | null;
}

interface TimescaleCTX extends TimescaleProviderProps {
  scale: ScaleLinear<number, number> | null;
}

export { TimescaleCTX, NestedInterval, IntervalMap, TimescaleOrientation };
