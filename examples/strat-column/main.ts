import { useAPIResult } from "@macrostrat/ui-components";
import { Spinner } from "@blueprintjs/core";
import { Column, preprocessUnits } from "@macrostrat/column-views";
import h from "@macrostrat/hyper";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

function useColumnUnits(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    { col_id, response: "long" },
    (res) => res.success.data
  );
}

function useColumnBasicInfo(col_id) {
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    { col_id },
    (res) => {
      return res.success.data[0];
    }
  );
}

function StratigraphicColumn(props: { id: number }) {
  const info = useColumnBasicInfo(props.id);
  const units = useColumnUnits(props.id);

  if (units == null || info == null) {
    return h(Spinner);
  }

  const data = preprocessUnits(units);

  return h("div", [h("h2", info.col_name), h(Column, { ...props, data })]);
}

function App() {
  return h(StratigraphicColumn, { id: 490 });
}

const root = createRoot(document.getElementById("root"));
root.render(h(StrictMode, h(App)));
