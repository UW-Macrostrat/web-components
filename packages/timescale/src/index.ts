import h from "@macrostrat/hyper";
import { defaultIntervals } from "./intervals";
import { group } from "d3-array";
import { TimescaleProvider } from "./provider";
import classNames from "classnames";
import "./main.styl";

enum TimescaleOrientation {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

interface TimescaleProps {
  intervals?: Interval[];
  orientation: TimescaleOrientation;
}

function ageSorter(a: Interval, b: Interval): number {
  /* For now this sorts only by early age and neglects overlap */
  return a.eag - b.eag;
}

function __nestMap(rootItem: Interval, intervalMap: Map<number, Interval[]>) {
  const items = intervalMap.get(rootItem.oid);
  if (items == null) return rootItem;
  items.sort(ageSorter);

  return {
    ...rootItem,
    children: items.map((d) => __nestMap(d, intervalMap)),
  };
}

function nestTimescale(rootID: number, intervals: Interval[]) {
  // Find the root interval by its id
  const rootItem = intervals.find((d) => d.oid == rootID);
  // Group by parent id
  const parentMap = group(intervals, (d) => d.pid);
  return [parentMap, __nestMap(rootItem, parentMap)];
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
  const { intervals, orientation } = props;

  const rootItem = {
    oid: 0,
    lvl: 0,
    col: "#000000",
    nam: "Geologic Time",
  };

  const [parentMap, timescale] = nestTimescale(0, [rootItem, ...intervals]);

  const className = classNames(orientation);

  return h(
    TimescaleProvider,
    { selectedInterval: null, parentMap },
    h("div.timescale", { className }, h(Interval, { interval: timescale }))
  );
}

Timescale.defaultProps = {
  intervals: defaultIntervals,
  orientation: TimescaleOrientation.HORIZONTAL,
};

export { Timescale, TimescaleOrientation };
