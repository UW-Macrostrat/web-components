import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { useAPIResult } from "@macrostrat/ui-components";
import { Column } from "@macrostrat/column-views";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { ColumnProps } from "@macrostrat/column-views";

const h = hyper.styled(styles);

function useColumnUnits(col_id, inProcess) {
  const status_code = inProcess ? "in process" : undefined;
  // show_position is needed to properly deal with `section` column types
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code, show_position: true },
    (res) => res.success.data
  );
}

function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id, status_code },
    (res) => {
      return res.success.data[0];
    }
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

  return h("div", [h("h2", info.col_name), h(Column, { ...rest, units })]);
}
