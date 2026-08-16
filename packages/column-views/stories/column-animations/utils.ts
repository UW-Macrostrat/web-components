import { useAPIResult } from "@macrostrat/ui-components";

/** Units for a single Macrostrat column, as used by the animation stories. */
export function useColumnUnits(col_id: number) {
  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code: "active", show_position: true },
    (res) => res.success.data,
  );
}
