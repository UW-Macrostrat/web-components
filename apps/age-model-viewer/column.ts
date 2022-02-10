import h from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext,
  ColumnAxisType
} from "@macrostrat/column-components";
import { useContext } from "react";
import { AnnotatedUnitsColumn } from "common/units";
import { IUnit, transformAxisType } from "common/units/types";
import { AgeAxis } from "common";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
import { ICompositeUnitProps, TrackedLabeledUnit } from "common";
import { AgeModelColumn, ColumnAgeDataset } from "./age-model-column";
import { MacrostratColumnProvider } from "@macrostrat/api-views";

interface ColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent: React.FunctionComponent<any>;
  unitComponentProps?: any;
  axisType?: ColumnAxisType;
}

function getRange(data, axisType: ColumnAxisType = ColumnAxisType.AGE) {
  const key = transformAxisType(axisType);
  return [data[data.length - 1]["b_" + key], data[0]["t_" + key]];
}

const Section = (props: ColumnProps) => {
  // Section with "squishy" time scale

  const {
    data,
    axisType,
    range = getRange(data, axisType),
    unitComponent
  } = props;
  let { pixelScale } = props;

  const dHeight = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length;
    pixelScale = Math.ceil(targetHeight / dHeight);
  }

  return h(
    MacrostratColumnProvider,
    {
      divisions: data,
      range,
      axisType: "depth",
      pixelsPerMeter: pixelScale // Actually pixels per myr
    },
    [
      h(AgeAxis, {
        width: 20,
        padding: 20,
        showLabel: false
      }),
      h(
        ColumnSVG,
        {
          width: 550,
          padding: 20,
          paddingLeft: 1,
          paddingV: 10,
          paddingBottom: 20
        },
        [
          h(AnnotatedUnitsColumn, {
            width: 350,
            columnWidth: 150,
            gutterWidth: 0,
            axisType,
            unitComponent,
            unitComponentProps: {
              nColumns: 1
            },
            nameForDivision: d => {
              return d.unit_name
                .replace(/[\d\.]+-[\d\.]+( mbsf)?: /g, "")
                .toLowerCase();
            }
          }),
          h(
            AgeModelColumn,
            {
              transform: "translate(160)",
              width: 550 - 160 - 10,
              nTicks: 10
            },
            h(ColumnAgeDataset, { stroke: "red", strokeWidth: 2 })
          )
        ]
      )
    ]
  );
};

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  const nOverlaps = division.overlappingUnits.length ?? 0;
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    axisType: "pos",
    width: nOverlaps > 0 ? width / nColumns : width,
    x: (division.column * width) / nColumns
  });
}

const AgeAxisLabel = ({ axisType: ColumnAxisType, axisLabel }) => {
  if (axisLabel == null) {
    axisLabel = "Height (meters)";
    if (ColumnAxisType === ColumnAxisType.AGE) {
      axisLabel = "Age (myr)";
    }
  }
  return h("div.age-axis-label", axisLabel);
};

const Column = (props: ColumnProps) => {
  const { data, unitComponent = UnitComponent, axisType } = props;

  let sectionGroups = Array.from(group(data, d => d.section_id));

  sectionGroups.sort((a, b) => a["t_" + axisType] - b["t_" + axisType]);

  return h("div.column", [
    h(AgeAxisLabel, { axisType, axisLabel: "Depth (meters below seafloor)" }),
    h(
      "div.main-column",
      sectionGroups.map(([id, values]) => {
        return h(`div.section.section-${id}`, [
          h(Section, {
            pixelScale: 5,
            data: values,
            axisType,
            unitComponent
          })
        ]);
      })
    )
  ]);
};

export { Section, AgeAxis };
export default Column;
