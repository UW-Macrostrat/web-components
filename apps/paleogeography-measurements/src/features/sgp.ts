import { useEffect, useState } from "react";
import axios from "axios";
import { clusterPoints, usePlateIntersection } from "./helpers";

function clusterSGPResult(rows: any[]) {
  console.log(rows);
  if (rows == null) return null;
  const data = rows.map(d => {
    return {
      type: "Feature",
      id: d["sample identifier"],
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(d["site longitude"]),
          parseFloat(d["site latitude"])
        ]
      }
    };
  });
  return clusterPoints(data);
}

async function getSGPResult(ageRange: [number, number]) {
  const filters = {
    type: "samples",
    count: 100000,
    page: 1,
    filters: {
      interpreted_age: ageRange
    },
    show: ["coord_lat", "coord_long"]
  };
  const res = await axios.post(
    "http://sgp-search.io/api/frontend/post-paged",
    filters
  );
  return clusterSGPResult(res?.data?.rows);
}

export function useSGPFeatures(time) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    getSGPResult([time - 10, time + 10]).then(setResult);
  }, [time]);
  return usePlateIntersection(result);
}
