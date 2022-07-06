import h, { C, compose } from "@macrostrat/hyper";
import { APIProvider, useAPIResult } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import { MeasurementDataProvider } from "../../carbon-isotopes/data-provider";
import {
  AlignedMeasurementProvider,
  FilteredMeasurementProvider
} from "../data-providers";
import { BaseSection, InteriorSection } from "./section";
import { CompositeUnitsColumn } from "common/units";
import {
  IsotopesColumn,
  IsotopesDataset
} from "../../carbon-isotopes/isotopes-column";
import {
  IsotopesSpectraColumn,
  IsotopeSpectrumNote,
  shouldRenderNote
} from "./spectra";
import { ColumnSpec } from "@macrostrat/api-types";
import { IUnit } from "common/units";
import patterns from "url:../../../geologic-patterns/*.png";
import { MeasuredSection } from "./measured-section";
import { preprocessUnits } from "../../column-inspector/process-data";
import "./main.styl";
import { UnitComponent } from "../../column-inspector/column";
import { ColumnMap } from "./map";

const timeRange = [650, 510];

// 1666 might be better, or 1481, or 1667
const largestScaleColumn: ColumnSpec = { col_id: 1666 };

const regionalColumn: ColumnSpec = {
  col_id: 2163,
  project_id: 10,
  status_code: "in process"
};

const measuredColumn: ColumnSpec = {
  col_id: 2164,
  project_id: 10,
  status_code: "in process"
};

// For measurements, we combine Nadaleen area and Sekwi area.
const measureSourceColumns: ColumnSpec = {
  ...regionalColumn,
  col_id: "2163,2164,2158,2159"
};

function Column(props: React.PropsWithChildren<{ params: ColumnSpec }>) {
  const { params, children, width = 350 } = props;
  const res: IUnit[] = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long"
  });
  if (res == null) return null;
  const data = preprocessUnits(res);

  return h("div.column", [
    h(InteriorSection, {
      data,
      // This is honestly extremely strange.
      range: [timeRange[1], timeRange[0]],
      pixelScale: 5,
      width,
      children
    })
  ]);
}

function MultiIsotopesColumn({ transform }) {
  return h("g.isotopes-columns", { transform }, [
    h(IsotopesColumn, {
      label: "δ¹³C",
      color: "dodgerblue",
      domain: [-20, 5],
      width: 50,
      nTicks: 2,
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
    h(MeasurementDataProvider, { ...measureSourceColumns }, [
      h(BaseSection, { range: timeRange, pixelScale: 5 }, [
        h(
          AlignedMeasurementProvider,
          { targetColumn: largestScaleColumn },
          h(Column, { params: largestScaleColumn, width: 280 }, [
            h(CompositeUnitsColumn, {
              width: 240,
              showLabels: false,
              unitComponent: UnitComponent,
              unitComponentProps: {
                nColumns: 2
              }
            })
            //h(IsotopesSpectraColumn)
          ])
        ),
        h(AlignedMeasurementProvider, { targetColumn: regionalColumn }, [
          h(Column, { params: regionalColumn, width: 310 }, [
            h(CompositeUnitsColumn, {
              width: 140,
              showLabels: false
            }),
            h(MultiIsotopesColumn, { transform: "translate(160,0)" })
          ])
        ]),
        h("div.spacer")
      ]),
      h("div", [
        h(
          FilteredMeasurementProvider,
          { filterFunc: d => d.sample_no.match(/^G3-/) != null },
          h(MeasuredSection, { params: measuredColumn }, [
            h(MultiIsotopesColumn, { transform: "translate(80,0)" })
          ])
        ),
        h(ColumnMap, {
          className: "column-map",
          col_id: 1666,
          margin: 0
        })
      ])
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
