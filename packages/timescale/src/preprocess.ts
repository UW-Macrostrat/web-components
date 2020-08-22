import { group } from "d3-array";
import { Interval, IntervalMap, NestedInterval } from "./types";

function ageSorter(a: Interval, b: Interval): number {
  /* For now this sorts only by early age and neglects overlap */
  return a.eag - b.eag;
}

function __nestMap(
  rootItem: Interval,
  intervalMap: IntervalMap
): NestedInterval {
  let items = intervalMap.get(rootItem.oid);
  if (items == null) items = [];
  if (items.length == 1 && items[0].nam == rootItem.nam) {
    /* This is effectively a special case for the Holocene, but
    it makes sure that identical time periods extend across levels */
    items = [];
  }

  items.sort(ageSorter);

  return {
    ...rootItem,
    children: items.map((d) => __nestMap(d, intervalMap)),
  };
}

function nestTimescale(
  rootID: number,
  intervals: Interval[]
): [IntervalMap, NestedInterval] {
  // Find the root interval by its id
  const rootItem = intervals.find((d) => d.oid == rootID);
  // Group by parent id
  const parentMap = group(intervals, (d) => d.pid);
  return [parentMap, __nestMap(rootItem, parentMap)];
}

export { nestTimescale };
