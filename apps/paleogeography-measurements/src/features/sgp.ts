import { useEffect, useState } from "react";
import axios from "axios";
import Supercluster from "supercluster";

export function clusterPoints(data, zoomLevel = 4, opts = {}) {
  const cluster = new Supercluster({
    radius: 20,
    ...opts
  });
  cluster.load(data);
  return cluster.getClusters([-180, -90, 180, 90], zoomLevel);
}

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
  const res = clusterPoints(data);
  console.log(res);
  return res;
}

async function getSGPResult(ageRange: [number, number]) {
  // const filters = {
  //   type: "samples",
  //   filters: { interpreted_age: ageRange },
  //   show: ["coord_lat", "coord_lon"]
  // };
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

export function useSGPData(time) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    getSGPResult([time - 10, time + 10]).then(setResult);
  }, [time]);
  return result;
}
