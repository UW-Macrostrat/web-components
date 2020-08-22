interface Interval {
  nam: string;
  oid: number;
  pid?: number;
  lvl: number;
  col: string;
  lag?: number;
  eag?: number;
  children?: Interval[];
}

interface TimescaleCTX {
  selectedInterval: Interval & null;
  parentMap: Map<number, Interval[]>;
}
