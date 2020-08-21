import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { group, rollup } from "d3-array";
import "./main.styl";

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

interface TimescaleProps {
  intervals?: Interval[];
}

function __nestMap(rootItem: Interval, intervalMap: Map<number, Interval[]>) {
  const items = intervalMap.get(rootItem.oid);
  if (items == null) return rootItem;
  return {
    ...rootItem,
    children: items.map((d) => __nestMap(d, intervalMap)),
  };
}

function nestTimescale(rootID: number, intervals: Interval[]) {
  // Find the root interval by its id
  const rootItem = intervals.find((d) => d.oid == rootID);
  // Group by parent id
  const map = group(intervals, (d) => d.pid);
  return __nestMap(rootItem, map);
}

function IntervalBox(props: { interval: Interval }) {
  const { interval: d } = props;
  return h(
    "div.interval-box",
    { key: d.oid, style: { backgroundColor: d.col } },
    h("span.interval-label", d.nam)
  );
}

function IntervalChildren({ children }) {
  if (children == null) return null;
  return h(
    "div.children",
    children.map((d) => {
      return h(Interval, { interval: d });
    })
  );
}

function Interval(props: { interval: Interval }) {
  const { interval } = props;
  const { children } = interval;
  return h("div.interval", [
    h(IntervalBox, { interval }),
    h(IntervalChildren, { children }),
  ]);
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

  const rootItem = {
    oid: 0,
    lvl: 0,
    col: "#000000",
    nam: "Geologic Time",
  };

  const timescale = nestTimescale(0, [rootItem, ...intervals]);

  return h(
    "div.timescale",
    timescale.children.map((d) => {
      return h(Interval, { interval: d });
    })
  );
}

Timescale.defaultProps = { intervals: defaultIntervals };

export { Timescale };
