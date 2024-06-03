import { ScaleContinuousNumeric } from "d3-scale";

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
}

interface NestedInterval extends Interval {
  children: Interval[];
}

type IntervalMap = Map<number, Interval[]>;

enum TimescaleOrientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

export interface TimescaleProviderProps {
  timescale: NestedInterval;
  selectedInterval: Interval | null;
  parentMap: IntervalMap;
  ageRange?: [number, number];
  length?: number;
  orientation: TimescaleOrientation;
  levels: [number, number] | null;
  scale?: ScaleContinuousNumeric<number, number> | null;
}

export interface TimescaleCTX extends TimescaleProviderProps {
  scale: ScaleContinuousNumeric<number, number> | null;
}

export { NestedInterval, IntervalMap, TimescaleOrientation };
