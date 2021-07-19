import h, { C, compose } from "@macrostrat/hyper";
import { APIProvider, useAPIResult } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import { MeasurementDataProvider } from "../../carbon-isotopes/data-provider";
import { MacrostratMeasurementProvider, ColumnSpec } from "../data-providers";
import { BaseSection, InteriorSection } from "./section";
import {
  CompositeUnitsColumn,
  AnnotatedUnitsColumn
} from "common/units/composite";
import {
  IsotopesColumn,
  IsotopesDataset
} from "../../carbon-isotopes/isotopes-column";
import {
  IsotopesSpectraColumn,
  IsotopeSpectrumNote,
  shouldRenderNote
} from "./spectra";
import { IUnit } from "common/units";
import patterns from "url:../../../geologic-patterns/*.png";
import { MeasuredSection } from "./measured-section";
import "./main.styl";

const timeRange = [650, 530];

// 1666 might be better, or 1481, or 1667
const largestScaleColumn = { col_id: 1666 };

const regionalColumn = {
  col_id: 2163,
  project_id: 10,
  status_code: "in process"
};

// For measurements, we combine Nadaleen area and Sekwi area.
const measureSourceColumns = {
  ...regionalColumn,
  col_id: "2163,2164,2158,2159"
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
  return h("g.isotopes-columns", { transform: "translate(160,0)" }, [
    h(IsotopesColumn, {
      label: "δ¹³C",
      color: "dodgerblue",
      domain: [-20, 5],
      width: 50,
      nTicks: 4,
      showAxis: true,
      parameter: "D13C"
    }),
    h(IsotopesColumn, {
      label: "δ¹⁸O",
      color: "red",
      domain: [-15, 5],
      width: 50,
      nTicks: 4,
      transform: "translate(70,0)",
      showAxis: true,
      parameter: "D18O"
    })
  ]);
}

const ColumnManager = () => {
  return h("div.column-array", [
    h(BaseSection, { range: timeRange, pixelScale: 6 }, [
      h(
        MacrostratMeasurementProvider,
        { target: largestScaleColumn, source: measureSourceColumns },
        h(Column, { params: largestScaleColumn }, h(IsotopesSpectraColumn))
      ),
      h(
        MacrostratMeasurementProvider,
        {
          source: measureSourceColumns,
          target: regionalColumn
        },
        [
          h(Column, { params: regionalColumn }, [
            h(CompositeUnitsColumn, {
              width: 140,
              showLabels: false
            }),
            h(MultiIsotopesColumn)
          ])
        ]
      ),
      h("div.spacer")
    ]),
    h(MeasuredSection)
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
