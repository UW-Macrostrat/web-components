import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { group, rollup } from "d3-array";

interface Interval {
  nam: string;
  oid: number;
  pid: number;
  lvl: number;
  color: string;
  lag: number;
  eag: number;
}

interface TimescaleProps {
  intervals?: Interval[];
}

function nestTimescale(rootItem, intervals: Interval[]) {
  const map = group(intervals, (d) => d.pid);
  const _nest = (id) => {
    const items = map.get(id);
    if (items == null) return null;
    return items.map((d) => _nest(id));
  };
  return _nest(rootItem);
}

function Timescale(props: TimescaleProps) {
  /**
   * A geologic timescale component for react.
   *
   * @remarks
   * Nothing yet.
   *
   * @param intervals - Intervals
   * @param width - Width of the timescale (optional)
   *
   */
  const { intervals } = props;
  const l1 = intervals.filter((d) => d.lvl == 1);

  const rootItem = {
    oid: 0,
    col: "#000000",
    nam: "Geologic Time",
    children: [],
  };

  const timescale = nestTimescale(0, intervals);
  console.log(timescale);

  return h(
    "div.timescale",
    { style: { width: 800, height: 200 } },
    l1.map((d) => {
      return h("div.interval", { key: d.oid }, h("span.interval-label", d.nam));
    })
  );
}

Timescale.defaultProps = { intervals: defaultIntervals };

export { Timescale };
