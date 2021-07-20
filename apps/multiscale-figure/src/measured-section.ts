import h from "@macrostrat/hyper";
import {
  ColumnProvider,
  ColumnSVG,
  useColumn,
  ColumnAxis,
  LithologyColumn,
  LithologyBoxes,
  GeneralizedSectionColumn,
  GrainsizeLayoutProvider,
  ColumnDivision,
  ColumnSurface
} from "@macrostrat/column-components";
import { AgeAxis } from "../../enriched-timeline/column";
import { IUnit } from "common/units/types";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

interface UnitDivision extends ColumnDivision {
  unit_id: number;
}

const columnData: UnitDivision[] = [
  {
    bottom: 0,
    top: 40,
    lithology: "sandstone",
    grainsize: "ms",
    pattern: "limestone",
    unit_id: 41216
  },
  {
    bottom: 40,
    top: 350,
    lithology: "limestone",
    grainsize: "s",
    pattern: "limestone",
    unit_id: 41217
  }
];

const BaseSection = (props: IColumnProps & { children: React.ReactNode }) => {
  // Section with "squishy" time scale
  const { data = [], range = [0, 341.3], children } = props;
  let { pixelScale } = props;

  const notesOffset = 100;

  return h("div.measured-section", [
    h(
      ColumnProvider,
      {
        divisions: columnData,
        range,
        pixelsPerMeter: 2
      },
      [
        h(ColumnSVG, { innerWidth: 80, padding: 20, paddingLeft: 40 }, [
          h(ColumnAxis),
          h(
            GrainsizeLayoutProvider,
            {
              width: 80,
              grainsizeScaleStart: 40
            },
            [h(GeneralizedSectionColumn, [h(LithologyBoxes)])]
          )
        ])
      ]
    ),
    children
  ]);
};

export function MeasuredSection(props) {
  return h(BaseSection);
}
