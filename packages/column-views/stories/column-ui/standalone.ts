import h from "@macrostrat/hyper";
import { FlexRow, Spacer, useAPIResult } from "@macrostrat/ui-components";
import { Column } from "../../src";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { ColumnProps } from "../../src";

function useColumnUnits(col_id, inProcess) {
  const status_codes = ["active"];
  if (inProcess) status_codes.push("in process");
  const status_code = status_codes.join(",");

  // show_position is needed to properly deal with `section` column types.
  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code, show_position: true },
    (res) => res.success.data,
  );
}

function useColumnBasicInfo(col_id, inProcess = false) {
  const status_codes = ["active"];
  if (inProcess) status_codes.push("in process");
  const status_code = status_codes.join(",");

  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/columns",
    { col_id, status_code },
    (res) => {
      return res.success.data[0];
    },
  );
}

export interface StandaloneColumnProps extends Omit<ColumnProps, "units"> {
  id: number;
  inProcess?: boolean;
}

export function StandaloneColumn(props: StandaloneColumnProps) {
  const { id, inProcess, ...rest } = props;
  const info = useColumnBasicInfo(id, inProcess);
  const units = useColumnUnits(id, inProcess);

  if (units == null || info == null) {
    return h(Spinner);
  }

  return h("div", [
    h(FlexRow, { gap: "2em", alignItems: "baseline" }, [
      h("h2", info.col_name),
      h("code", info.col_id),
    ]),
    h(Column, { ...rest, units }),
  ]);
}
