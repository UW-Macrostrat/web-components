/// https://paleobiodb.org/data1.2/colls/summary.json?show=time&min_ma=10&max_ma=12&level=3

import { useAPIResult } from "@macrostrat/ui-components";
import { usePlateIntersection } from "./helpers";

function createFeature(record) {
  const { lng, lat, ...rest } = record;
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    ...rest
  };
}

export function usePBDBFeatures(time: number, timeDelta: number = 2) {
  /** Get features and assign to plates */
  const res = useAPIResult<{ records: any[] }>(
    "https://paleobiodb.org/data1.2/colls/summary.json",
    {
      show: "time",
      min_ma: time - timeDelta,
      max_ma: time + timeDelta,
      level: 3
    }
  );
  return usePlateIntersection(res?.records.map(createFeature));
}
