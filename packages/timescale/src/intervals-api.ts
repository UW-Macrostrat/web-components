/** Helpers to fetch Macrostrat intervals from the API.
 *
 * TODO: integrate with MacrostratColumnDataProvider to provide intervals via context.
 * */

import { MacrostratInterval } from "@macrostrat/api-types";
import { defaultIntervals } from "./intervals";
import { useState } from "react";
import { useAsyncEffect } from "@macrostrat/ui-components";
import { Interval } from "./types";

export async function fetchMacrostratIntervals(
  baseUrl: string,
  // Default to ICS timescale
  timescaleID?: number = 11,
): Promise<MacrostratInterval[]> {
  const url = new URL(`${baseUrl}/defs/intervals`);
  url.searchParams.set("timescale_id", timescaleID.toString());
  const response = await fetch(url.toString());

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

export function buildIntervalsTree(
  intervals: MacrostratInterval[],
): Interval[] {
  // Geologic time
  const rootInterval: Interval = defaultIntervals[0];

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
  baseURL = "https://macrostrat.org/api/v2",
): Interval[] {
  /** Get a stratified tree of ICS intervals from the Macrostrat API. */
  const [intervals, setIntervals] = useState<Interval[]>([]);

  useAsyncEffect(async () => {
    const fetchedIntervals = await fetchMacrostratIntervals(baseURL, 11);
    const intervalTree = buildIntervalsTree(fetchedIntervals);
    setIntervals(intervalTree);
  }, [baseURL]);

  return intervals;
}
