import { useAPIResult } from "@macrostrat/ui-components";

const apiV2Prefix = `https://dev.macrostrat.org/api/v2`;
const gddDomain = `https://xdd.wisc.edu`;
const paleobioDomain = `https://paleobiodb.org`;

export function useMapInfo(lng, lat, z) {
  return useAPIResult(`${apiV2Prefix}/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  });
}

export function useColumnInfo(lng, lat) {
  return useAPIResult(`${apiV2Prefix}/columns`, {
    lat,
    lng,
    response: "long",
  })?.[0];
}

export function useXddInfo(stratNames) {
  return useAPIResult(`${gddDomain}/api/v1/snippets`, {
    article_limit: 20,
    term: stratNames?.map((d) => d.rank_name).join(","),
  });
}

export function useFossilInfo(lng, lat) {
  const collectionResponse = useAPIResult(
    `${paleobioDomain}/data1.2/colls/list.json?lngmin=${lng - 0.1}&lngmax=${lng + 0.1}&latmin=${lat - 0.1}&latmax=${lat + 0.1}`,
  )?.records;

  const occurrences = useAPIResult(
    `${paleobioDomain}/data1.2/occs/list.json?lngmin=${lng - 0.1}&lngmax=${lng + 0.1}&latmin=${lat - 0.1}&latmax=${lat + 0.1}`,
  )?.records;

  if (!collectionResponse || !occurrences) {
    return null;
  }

  try {
    return collectionResponse.map((col) => {
      col.occurrences = [];
      occurrences.forEach((occ) => {
        if (occ.cid === col.oid) {
          col.occurrences.push(occ);
        }
      });
      return col;
    });
  } catch (error) {
    console.log(error);
    return [];
  }
}
