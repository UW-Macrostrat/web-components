import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";

import { useAPIResult } from "@macrostrat/ui-components";
import BaseColumn from "./column";
import { ColumnNavigationSVGMap, MeasurementsLayer } from "../maps";
import { MacrostratDataProvider } from "../data-provider";
import { MeasurementDataProvider } from "./data-provider";
import { ColumnArgs, useColumnNav } from "../units";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";

const h = hyper.styled(styles);

const ColumnTitle = (props) => {
  return h.if(props.data != null)("h1", props.data?.col_name);
};

const defaultArgs: ColumnArgs = {
  col_id: 2192,
  //unit_id: null,
  project_id: 10,
  status_code: "in process",
};

export function CarbonIsotopesColumn(columnArgs) {
  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, columnArgs, [
      // @ts-ignore
      h(BaseColumn, { params: columnArgs }),
    ])
  );
}

function ColumnManager() {
  const [columnArgs, setCurrentColumn] = useColumnNav(defaultArgs);
  const { col_id, ...projectParams } = columnArgs;

  const colParams = useMemo(
    () => ({ ...columnArgs, format: "geojson" }),
    [columnArgs]
  );
  const res: FeatureCollection = useAPIResult("/columns", colParams);
  const columnFeature = res?.features[0];

  return h(MeasurementDataProvider, columnArgs, [
    h("div.column-ui", [
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        // @ts-ignore
        h(BaseColumn, { params: columnArgs }),
      ]),
      h("div.map-column", [
        h(
          ColumnNavigationSVGMap,
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
  return h(MacrostratDataProvider, h(ColumnManager));
}
