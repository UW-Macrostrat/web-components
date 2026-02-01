import {
  IsotopesColumn,
  MeasurementDataProvider,
  ColumnNavigationSVGMap,
  MeasurementsLayer,
  useColumnNav,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { FlexRow, useAPIResult } from "@macrostrat/ui-components";
import { useMemo } from "react";
import { FeatureCollection } from "geojson";
import { MacrostratDataProvider } from "@macrostrat/data-provider";

function StableIsotopesOverlay(props) {
  return h(MeasurementDataProvider, { col_id: props.columnID }, [
    h(IsotopesColumn, {
      parameter: "D13C",
      label: "δ¹³C",
      width: 100,
      nTicks: 4,
    }),
    h(IsotopesColumn, {
      parameter: "D18O",
      label: "δ¹⁸O",
      color: "red",
      domain: [-40, 0],
      width: 100,
      nTicks: 4,
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
    }),
  );
}

export default {
  tags: ["!autodocs"],
  title: "Column views/Facets/Carbon isotopes",
  component: CarbonIsotopesColumn,
};

export const BasicCarbonIsotopesColumn = {
  args: {
    id: 2192,
    project_id: 10,
    inProcess: true,
    showTimescale: false,
    showLabelColumn: false,
    allowUnitSelection: false,
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
    [columnArgs],
  );
  const res: FeatureCollection = useAPIResult(
    "https://dev.macrostrat.org/api/v2/columns",
    colParams,
    (res) => res?.success?.data,
  );
  const columnFeature = res?.features[0];

  return h(
    MacrostratDataProvider,
    h(MeasurementDataProvider, columnArgs, [
      h(FlexRow, { className: "column-ui", margin: "2em", gap: "1em" }, [
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
          }),
        ),
        h("div.column-view", [
          h(CarbonIsotopesColumn, {
            id: columnArgs.col_id,
            inProcess: true,
            showLabelColumn: false,
          }),
        ]),
      ]),
    ]),
  );
}
