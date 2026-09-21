/** Helpers to fetch Macrostrat intervals from the API.
 *
 * TODO: integrate with MacrostratColumnDataProvider to provide intervals via context.
 * */

import { MacrostratInterval } from "@macrostrat/api-types";
import { defaultIntervals } from "./intervals";
import { useEffect, useMemo, useState } from "react";
import { useMacrostratData, useMacrostratStore } from "@macrostrat/data-provider";
import { Interval } from "./types";

interface FetchIntervalsOptions {
  baseURL?: string;
  fetch?: typeof fetch;
  timescaleID?: number;
}

interface BuildTreeOptions {
  rootIntervalName?: string;
}

interface MacrostratIntervalsOptions
  extends FetchIntervalsOptions, BuildTreeOptions {
  buildTree?(
    intervals: MacrostratInterval[],
    opts?: BuildTreeOptions,
  ): Interval[];
}

export async function fetchMacrostratIntervals(
  opts: FetchIntervalsOptions = {},
): Promise<MacrostratInterval[]> {
  const { baseURL = "https://macrostrat.org/api/v2", timescaleID = 11 } = opts;
  const _fetch = opts.fetch ?? fetch;

  const url = new URL(`${baseURL}/defs/intervals`);
  url.searchParams.set("timescale_id", timescaleID.toString());
  const response = await _fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch intervals: ${response.statusText}`);
  }

  const res = await response.json();

  const data = res.success?.data;

  if (!Array.isArray(data)) {
    throw new Error("Invalid data received from API");
  }

  return data as MacrostratInterval[];
}

export function buildInternationalIntervalsTree(
  intervals: MacrostratInterval[],
  opts: BuildTreeOptions = {},
): Interval[] {
  // Geologic time
  const rootInterval: Interval = defaultIntervals[0];
  rootInterval.nam = opts.rootIntervalName ?? rootInterval.nam;

  const levels = [1, 2, 3, 4, 5];
  const levelMap = new Map<number, MacrostratInterval[]>();
  for (const level of levels) {
    levelMap.set(level, []);
  }

  for (const interval of intervals) {
    const level = getIntervalLevel(interval);
    if (level != null) {
      levelMap.get(level).push(interval);
    }
  }

  const output = [rootInterval]; // Geologic time
  for (const [lvl, entries] of levelMap.entries()) {
    const levelIntervals: Interval[] = [];
    const parentLevel = lvl - 1;
    const parentIntervals = levelMap.get(parentLevel);
    for (const int of entries) {
      // Find parent interval
      let pid: number;
      if (parentLevel === 0) {
        pid = 0;
      } else {
        pid = parentIntervals.find((parentInt) => {
          return int.t_age >= parentInt.t_age && int.b_age <= parentInt.b_age;
        })?.int_id;
        if (pid == null) {
          console.warn(
            `No parent found for interval ${int.name} (level ${lvl})`,
          );
          continue;
        }
      }
      levelIntervals.push({
        oid: int.int_id,
        typ: "int",
        lvl,
        nam: int.name,
        eag: int.b_age,
        lag: int.t_age,
        pid: pid,
        col: int.color,
        int_id: int.int_id,
      });
    }
    // sort level intervals by t_age descending
    levelIntervals.sort((a, b) => b.eag - a.eag);
    output.push(...levelIntervals);
  }
  return output;
}

function getIntervalLevel(interval: MacrostratInterval): number {
  const levelMap: { [key: string]: number } = {
    eon: 1,
    era: 2,
    period: 3,
    epoch: 4,
    age: 5,
  };

  return levelMap[interval.int_type.toLowerCase()];
}

export function useMacrostratIntervals(
  opts: MacrostratIntervalsOptions = {},
): Interval[] {
  /** Get a stratified tree of ICS intervals from the Macrostrat API. */
  const {
    buildTree = defaultBuildIntervalsTree,
    rootIntervalName,
    timescaleID = 11,
  } = opts;

  const data = useMacrostratData("intervals", null, timescaleID);

  return useMemo(() => {
    if (data == null) {
      return [];
    }
    return treeBuilderFor(timescaleID, buildTree)(data);
  }, [data, buildTree]);
}

/** Get interval trees for several timescales at once, keyed by timescale ID.
 *
 * Views that show timescales side by side (against a shared scale, say) need
 * every timescale's intervals in one place — to build a scale that spans all
 * of them, for instance. Calling `useMacrostratIntervals` once per timescale
 * can't do that: the number of timescales would set the number of hooks.
 */
export function useMacrostratTimescales(
  timescaleIDs: number[],
  opts: MacrostratIntervalsOptions = {},
): Map<number, Interval[]> {
  const { buildTree = defaultBuildIntervalsTree } = opts;
  const getIntervals = useMacrostratStore((state) => state.getIntervals);

  const [data, setData] = useState<Map<number, MacrostratInterval[]> | null>(
    null,
  );

  // Identity of the array isn't stable across renders, so key the fetch on
  // the IDs themselves
  const key = timescaleIDs.join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = key.split(",").filter(Boolean).map(Number);

    Promise.all(
      ids.map(async (id): Promise<[number, MacrostratInterval[]]> => {
        return [id, await getIntervals(null, id)];
      }),
    ).then((entries) => {
      if (cancelled) return;
      // Merged, not replaced: changing the set of timescales shouldn't blank
      // out the ones already loaded while the new one is fetched
      setData((previous) => {
        const next = new Map(previous ?? []);
        for (const [id, intervals] of entries) {
          next.set(id, intervals);
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [getIntervals, key]);

  return useMemo(() => {
    const trees = new Map<number, Interval[]>();
    if (data == null) {
      return trees;
    }
    for (const [id, intervals] of data) {
      if (intervals == null || intervals.length == 0) continue;
      trees.set(id, treeBuilderFor(id, buildTree)(intervals));
    }
    return trees;
  }, [data, buildTree]);
}

/** The international timescale is the only one with a real hierarchy; the
 * rest are flat lists of intervals. */
function treeBuilderFor(
  timescaleID: number,
  buildTree: (intervals: MacrostratInterval[]) => Interval[],
) {
  if (timescaleID === 11) {
    return buildInternationalIntervalsTree;
  }
  return buildTree;
}

function defaultBuildIntervalsTree(
  intervals: MacrostratInterval[],
  opts: BuildTreeOptions = {},
): Interval[] {
  // Build a tree of intervals from the API response, starting with a root interval r
  // For non-ICS timescales, just return a flat list of intervals sorted by t_age descending
  const i1 = intervals
    .map((int) => ({
      oid: int.int_id,
      typ: "int",
      lvl: 1,
      nam: int.name,
      eag: int.b_age,
      lag: int.t_age,
      pid: 0,
      col: int.color,
      int_id: int.int_id,
    }))
    .sort((a, b) => b.eag - a.eag);
  // Add a root interval representing the entire timescale
  return [
    {
      oid: 0,
      typ: "int",
      lvl: 0,
      nam: opts.rootIntervalName ?? "Timescale",
      eag: Math.max(...i1.map((int) => int.eag)),
      lag: Math.min(...i1.map((int) => int.lag)),
      pid: null,
      col: "#ffffff",
    },
    ...i1,
  ];
}
