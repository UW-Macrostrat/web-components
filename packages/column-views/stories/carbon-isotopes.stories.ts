import {
  IsotopesColumn,
  MacrostratDataProvider,
  MeasurementDataProvider,
} from "../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "./column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { ColumnNavigationSVGMap, MeasurementsLayer } from "../src/maps";
import { ColumnArgs, useColumnNav } from "../src/data-provider";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";

function StableIsotopesOverlay(props) {
  return h(MeasurementDataProvider, { col_id: props.columnID }, [
    h(IsotopesColumn, {
      parameter: "D13C",
      label: "δ¹³C",
      width: 100,
      nTicks: 4,
      showAxis: true,
    }),
    h(IsotopesColumn, {
      parameter: "D18O",
      label: "δ¹⁸O",
      color: "red",
      domain: [-40, 0],
      width: 100,
      nTicks: 4,
      showAxis: true,
    }),
  ]);
}

function CarbonIsotopesColumn(props) {
  const { id, children, ...rest } = props;

  return h(
    MacrostratDataProvider,
    h(StandaloneColumn, {
      id,
      ...rest,
      children: [h(StableIsotopesOverlay, { columnID: id }), children],
    })
  );
}

export default {
  title: "Column views/Carbon Isotopes",
  component: CarbonIsotopesColumn,
};

export const BasicCarbonIsotopesColumn = {
  args: {
    id: 2192,
    project_id: 10,
    inProcess: true,
    showTimescale: false,
    showLabelColumn: false,
  },
};

export function EdiacaranCompilation(defaultArgs) {
  const [columnArgs, setCurrentColumn] = useColumnNav({
    ...(defaultArgs ?? {}),
    col_id: 2192,
    project_id: 10,
    status_code: "in process",
  });
  const { col_id, ...projectParams } = columnArgs;

  const colParams = useMemo(
    () => ({ ...columnArgs, format: "geojson" }),
    [columnArgs]
  );
  const res: FeatureCollection = useAPIResult("/columns", colParams);
  const columnFeature = res?.features[0];

  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, columnArgs, [
      h(FlexRow, { className: "column-ui", margin: "2em", gap: "1em" }, [
        h("div.column-view", [
          h(CarbonIsotopesColumn, {
            id: columnArgs.col_id,
            inProcess: true,
            showLabelColumn: false,
          }),
        ]),
        h(
          ColumnNavigationSVGMap,
          {
            currentColumn: columnFeature,
            setCurrentColumn,
            margin: 0,
            style: { width: 400, height: 500 },
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
    ])
  );
}
