import h, { C, compose } from "@macrostrat/hyper";
import { APIProvider, useAPIResult } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import { MeasurementDataProvider } from "../../carbon-isotopes/data-provider";
import { MacrostratMeasurementProvider, ColumnSpec } from "../data-providers";
import { BaseSection, InteriorSection } from "./section";
import {
  IsotopesColumn,
  IsotopesDataset
} from "../../carbon-isotopes/isotopes-column";
import { IsotopesSpectraColumn } from "./spectra";
import { IUnit } from "common/units";
import patterns from "url:../../../geologic-patterns/*.png";
import "./main.styl";

const timeRange = [630, 530];

const columnArgs = {
  col_id: 2163,
  project_id: 10,
  status_code: "in process"
};

function Column(props: React.PropsWithChildren<{ params: ColumnSpec }>) {
  const { params, children } = props;
  const data: IUnit[] = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long"
  });
  if (data == null) return null;

  return h("div.column", [
    h(InteriorSection, {
      data,
      // This is honestly extremely strange.
      range: [timeRange[1], timeRange[0]],
      pixelScale: 6,
      children
    })
  ]);
}

function MultiIsotopesColumn(props) {
  return h(
    IsotopesColumn,
    {
      parameter: "D18O",
      label: "δ¹⁸O",
      color: "red",
      domain: [-15, 5],
      width: 100,
      nTicks: 4,
      showAxis: true
    },
    [
      h(IsotopesDataset, { parameter: "D18O", color: "red" }),
      h(IsotopesDataset, { parameter: "D13C", color: "dodgerblue" })
    ]
  );
}

const ColumnManager = () => {
  const { col_id, ...projectParams } = columnArgs;

  // 1666 might be better, or 1481, or 1667

  const params1 = { col_id: 1666 };
  return h("div.column-array", [
    h(BaseSection, { range: timeRange, pixelScale: 6 }, [
      h(
        MacrostratMeasurementProvider,
        { target: params1, source: { col_id } },
        h(Column, { params: params1 }, h(IsotopesSpectraColumn))
      ),
      h(MeasurementDataProvider, columnArgs, [
        h(Column, { params: columnArgs }, h(MultiIsotopesColumn))
      ]),
      h("div.spacer")
    ])
  ]);
};

const resolvePattern = id => patterns[id];

const App = compose(
  C(GeologicPatternProvider, { resolvePattern }),
  C(APIProvider, {
    baseURL: "https://dev.macrostrat.org/api/v2",
    unwrapResponse: res => res.success.data
  }),
  ColumnManager
);

export default App;
