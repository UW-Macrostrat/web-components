import h from "@macrostrat/hyper";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnContext
} from "@macrostrat/column-components";
import { AgeAxis } from "../../enriched-timeline/column";
import { CompositeUnitsColumn } from "common/units";
import { IUnit } from "common/units/types";
import { useContext } from "react";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

const BaseSection = (props: IColumnProps & { children: React.ReactNode }) => {
  // Section with "squishy" time scale
  const {
    data = [],
    range = [data[data.length - 1].b_age, data[0].t_age],
    children
  } = props;
  let { pixelScale } = props;

  const notesOffset = 100;

  const dAge = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length;
    pixelScale = Math.ceil(targetHeight / dAge);
  }

  return h([
    h(
      ColumnProvider,
      {
        divisions: data,
        range,
        pixelsPerMeter: pixelScale // Actually pixels per myr
      },
      [
        h(AgeAxis, {
          tickSpacing: 80,
          width: 30,
          padding: 20,
          paddingRight: 30
        }),

        h(Timescale, {
          orientation: TimescaleOrientation.VERTICAL,
          length: dAge * pixelScale,
          levels: [2, 3],
          absoluteAgeScale: true,
          showAgeAxis: false,
          ageRange: range
        })
      ]
    ),
    children
  ]);
};

function InteriorSection(props: React.PropsWithChildren<IColumnProps>) {
  const { data, range, pixelScale, children } = props;

  return h(
    ColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale // Actually pixels per myr
    },
    [
      h(
        ColumnSVG,
        {
          width: 650,
          padding: 0,
          paddingLeft: 0,
          paddingV: 20
        },
        [
          h(CompositeUnitsColumn, {
            width: 400,
            columnWidth: 140,
            gutterWidth: 0
          }),
          children
        ]
      )
    ]
  );
}

export { BaseSection, InteriorSection, AgeAxis };
