/// https://paleobiodb.org/data1.2/colls/summary.json?show=time&min_ma=10&max_ma=12&level=3

import { useMemo } from "react";
import { useAPIResult } from "@macrostrat/ui-components";
import { usePlatePolygons } from "@macrostrat/corelle";
import { intersectFeatures } from "./helpers";

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

  const polygons = usePlatePolygons();

  const platePoints = useMemo(() => {
    /** Memoized computation of polygon-point intersections */
    if (res == null || polygons == null) return [];
    return intersectFeatures(polygons, res.records);
  }, [res, polygons]);

  return platePoints;
}
