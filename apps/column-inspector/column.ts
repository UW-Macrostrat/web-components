import h from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  LithologyColumn,
  ColumnAxis,
  ColumnContext,
  NotesColumn
} from "@macrostrat/column-components";
import { CompositeUnitsColumn } from "common/units";
import { IUnit } from "common/units/types";
import { useContext } from "react";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
//
interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

const AgeAxisCore = ({ ticks, tickSpacing = 40 }) => {
  const { pixelHeight } = useContext(ColumnContext);
  // A tick roughly every 40 pixels
  let v = Math.max(Math.round(pixelHeight / tickSpacing), 1);

  return h(ColumnAxis, {
    ticks: v,
    showDomain: false
  });
};

function AgeAxis(props) {
  const {
    ticks,
    tickSpacing,
    showLabel = true,
    paddingV = 10,
    ...rest
  } = props;

  // Not sure where this extra 5px comes from.
  const marginTop = -paddingV + 5;
  return h("div.column", { style: { marginTop, marginBottom: -paddingV } }, [
    h.if(showLabel)("div.age-axis-label", "Age (Ma)"),
    h(ColumnSVG, { paddingV, ...rest }, h(AgeAxisCore, { ticks, tickSpacing }))
  ]);
}

const Section = (props: IColumnProps) => {
  // Section with "squishy" time scale
  const { data, range = [data[data.length - 1].b_age, data[0].t_age] } = props;
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
          h(CompositeUnitsColumn, {
            width: 400,
            columnWidth: 140,
            gutterWidth: 0
          })
        ]
      )
    ]
  );
};

const Column = (props: IColumnProps) => {
  const { data } = props;

  let sectionGroups = Array.from(group(data, d => d.section_id));

  sectionGroups.sort((a, b) => a.t_age - b.t_age);

  return h("div.column", [
    h("div.age-axis-label", "Age (Ma)"),
    h(
      "div.main-column",
      sectionGroups.map(([id, values]) => {
        return h(`div.section.section-${id}`, [h(Section, { data: values })]);
      })
    )
  ]);
};

export { Section, AgeAxis };
export default Column;
