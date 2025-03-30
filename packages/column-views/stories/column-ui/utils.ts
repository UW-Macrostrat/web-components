import { useAPIResult } from "@macrostrat/ui-components";

export function useColumnUnits(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code },
    (res) => res.success.data
  );
}

export function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id, status_code },
    (res) => {
      return res.success.data[0];
    }
  );
}
