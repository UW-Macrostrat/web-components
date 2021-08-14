import { useEffect, useState } from "react";
import axios from "axios";

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
  console.log(res?.data?.rows);
  return res?.data;
}

export function useSGPResult(time) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    getSGPResult([time - 10, time + 10]).then(setResult);
  }, [time]);
  return result;
}
