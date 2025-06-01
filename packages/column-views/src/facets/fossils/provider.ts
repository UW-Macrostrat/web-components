import { group } from "d3-array";
import { createAPIContext, useAPIResult } from "@macrostrat/ui-components";

const responseUnwrapper = (d) => d.records;

const pbdbAPIContext = createAPIContext({
  baseURL: "https://training.paleobiodb.org/data1.2",
  unwrapResponse: responseUnwrapper,
});

export enum FossilDataType {
  Occurrences = "occs",
  Collections = "colls",
}

export function useFossilData(type: FossilDataType, { col_id }) {
  const params = {
    ms_column: col_id,
    show: "full,mslink",
  };
  const res: any[] = useAPIResult(`/${type}/list.json`, params, {
    context: pbdbAPIContext,
  });
  if (res == null) return null;
  const r1 = res.map((d) => {
    let unit_id = null;
    let col_id = null;
    // Standardize names of Macrostrat units and columns
    if (d.msu !== null) {
      unit_id = parseInt(d.msu.replace(/^\w+:/, ""));
    }
    if (d.msc !== null) {
      col_id = parseInt(d.msc.replace(/^\w+:/, ""));
    }

    return { ...d, unit_id, col_id };
  });
  return group(r1, (d) => d.unit_id);
}
