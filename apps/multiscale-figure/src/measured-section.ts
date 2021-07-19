import h from "@macrostrat/hyper";
import {
  ColumnProvider,
  ColumnSVG,
  useColumn,
  LithologyColumn
} from "@macrostrat/column-components";
import { AgeAxis } from "../../enriched-timeline/column";
import { IUnit } from "common/units/types";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
import { ColumnDivision } from "packages/column-components/dist/types/defs";

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

const columnData: ColumnDivision[] = [];

const BaseSection = (props: IColumnProps & { children: React.ReactNode }) => {
  // Section with "squishy" time scale
  const { data = [], range = [0, 300], children } = props;
  let { pixelScale } = props;

  const notesOffset = 100;

  return h([
    h(
      ColumnProvider,
      {
        divisions: columnData,
        range,
        pixelsPerMeter: 2
      },
      [
        h(AgeAxis, {
          tickSpacing: 80,
          width: 30,
          padding: 20,
          paddingRight: 30
        }),
        h(ColumnSVG, { width: 80 }, h(LithologyColumn, { width: 80 }))
      ]
    ),
    children
  ]);
};

export function MeasuredSection(props) {
  return h(BaseSection);
}
