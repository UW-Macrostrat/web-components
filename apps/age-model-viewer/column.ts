import h from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext
} from "@macrostrat/column-components";
import { useContext } from "react";
import { CompositeUnitsColumn, SimpleUnitsColumn } from "common/units";
import { IUnit } from "common/units/types";
import { AgeAxis } from "common";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
import { ICompositeUnitProps, TrackedLabeledUnit } from "common";
import { ColumnAxisType } from "common/units/boxes";

interface ColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent: React.FunctionComponent<any>;
  unitComponentProps?: any;
  axisType?: ColumnAxisType;
}

function getRange(data, axisType: ColumnAxisType = ColumnAxisType.AGE) {
  return [data[data.length - 1]["b_" + axisType], data[0]["t_" + axisType]];
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

  const dAge = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length;
    pixelScale = Math.ceil(targetHeight / dAge);
  }

  pixelScale = 200;

  return h(
    ColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale // Actually pixels per myr
    },
    [
      h(AgeAxis, {
        width: 20,
        padding: 20,
        showLabel: false
      }),
      h(Timescale, {
        orientation: TimescaleOrientation.VERTICAL,
        length: dAge * pixelScale,
        levels: [2, 5],
        absoluteAgeScale: true,
        showAgeAxis: false,
        ageRange: range
      }),
      h(
        ColumnSVG,
        {
          width: 650,
          padding: 20,
          paddingLeft: 1,
          paddingV: 5
        },
        h(SimpleUnitsColumn, {
          width: 450,
          columnWidth: 250,
          axisType,
          unitComponent,
          unitComponentProps: {
            nColumns: 1,
            axisType: "pos"
          }
        })
      )
    ]
  );
};

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    axisType: "pos",
    width: division.overlappingUnits.length > 0 ? width / nColumns : width,
    x: (division.column * width) / nColumns
  });
}

const Column = (props: ColumnProps) => {
  const { data, unitComponent = UnitComponent, axisType } = props;

  let sectionGroups = Array.from(group(data, d => d.section_id));

  //sectionGroups.sort((a, b) => a.t_age - b.t_age);

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(
      "div.main-column",
      sectionGroups.map(([id, values]) => {
        return h(`div.section.section-${id}`, [
          h(Section, {
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
