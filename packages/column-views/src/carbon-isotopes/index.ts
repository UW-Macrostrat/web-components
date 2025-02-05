import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";

import { useAPIResult } from "@macrostrat/ui-components";
import Column from "./column";
import { ColumnNavigatorMap, MeasurementsLayer } from "../map";
import { MeasurementDataProvider } from "./data-provider";
import { MacrostratAPIProvider } from "../providers";
import { useColumnNav } from "../units";

const h = hyper.styled(styles);

const ColumnTitle = (props) => {
  return h.if(props.data != null)("h1", props.data?.col_name);
};

const defaultArgs = {
  col_id: 2192,
  //unit_id: null,
  project_id: 10,
  status_code: "in process",
};

export function CarbonIsotopesColumn(columnArgs) {
  return h(
    MacrostratAPIProvider,
    h(MeasurementDataProvider, columnArgs, [h(Column, { params: columnArgs })])
  );
}

function ColumnManager() {
  const [columnArgs, setCurrentColumn] = useColumnNav(defaultArgs);
  const { col_id, ...projectParams } = columnArgs;

  const colParams = { ...columnArgs, format: "geojson" };
  const res = useAPIResult("/columns", colParams, [columnArgs]);
  const columnFeature = res?.features[0];

  //return h("div.column-manager", "Hello, world");

  return h(MeasurementDataProvider, columnArgs, [
    h("div.column-ui", [
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        h(Column, { params: columnArgs }),
      ]),
      h("div.map-column", [
        h(
          ColumnNavigatorMap,
          {
            currentColumn: columnFeature,
            setCurrentColumn,
            margin: 0,
            ...projectParams,
          },
          h(MeasurementsLayer, {
            ...projectParams,
            style: {
              fill: "dodgerblue",
              stroke: "blue",
            },
          })
        ),
      ]),
    ]),
  ]);
}

export function CarbonIsotopesApp() {
  return h(MacrostratAPIProvider, h(ColumnManager));
}
