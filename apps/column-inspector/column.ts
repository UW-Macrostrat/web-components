import h from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext
} from "@macrostrat/column-components";
import { useContext } from "react";
import { CompositeUnitsColumn } from "common/units";
import { IUnit } from "common/units/types";
import { AgeAxis } from "common";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
import { ICompositeUnitProps, TrackedLabeledUnit } from "common";

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitsComponent: React.FunctionComponent<ICompositeUnitProps>;
}

const Section = (props: IColumnProps) => {
  // Section with "squishy" time scale
  const {
    data,
    range = [data[data.length - 1].b_age, data[0].t_age],
    unitsComponent
  } = props;
  let { pixelScale } = props;

  const notesOffset = 100;

  const dAge = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length;
    pixelScale = Math.ceil(targetHeight / dAge);
  }

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
        [
          h(unitsComponent, {
            width: 400,
            columnWidth: 140,
            gutterWidth: 0
          })
        ]
      )
    ]
  );
};

function UnitComponent({ division, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: division.overlappingUnits.length > 0 ? width / 2 : width,
    x: division.overlappingUnits.length == 1 ? width / 2 : 0
  });
}

const MultiColumnUnits = (props: ICompositeUnitProps) => {
  return h(CompositeUnitsColumn, {
    ...props,
    unitComponent: UnitComponent
  });
};

const Column = (props: IColumnProps) => {
  const { data, unitsComponent = MultiColumnUnits } = props;

  let sectionGroups = Array.from(group(data, d => d.section_id));

  sectionGroups.sort((a, b) => a.t_age - b.t_age);

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(
      "div.main-column",
      sectionGroups.map(([id, values]) => {
        return h(`div.section.section-${id}`, [
          h(Section, { data: values, unitsComponent })
        ]);
      })
    )
  ]);
};

export { Section, AgeAxis };
export default Column;
