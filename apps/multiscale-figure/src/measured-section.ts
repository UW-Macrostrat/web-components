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
import { BaseUnit, ColumnSpec, UnitLong } from "@macrostrat/api-types";
import { AgeAxis } from "../../enriched-timeline/column";
import { IUnit } from "common/units/types";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import "@macrostrat/timescale/dist/timescale.css";
import { useAPIResult } from "@macrostrat/ui-components";

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

type UnitDivision = ColumnDivision & BaseUnit;

interface ColumnSurface {
  height: number;
}

const columnData: ColumnSurface[] = [
  {
    height: 0,
    lithology: "sandstone",
    grainsize: "ms",
    pattern: "limestone",
    unit_id: 41216
  },
  {
    height: 182,
    lithology: "limestone",
    grainsize: "s",
    pattern: "limestone",
    unit_id: 41217
  },
  {
    height: 320,
    lithology: "limestone",
    grainsize: "s",
    pattern: "limestone",
    unit_id: 41218
  }
];

function buildDivisions<T extends ColumnSurface>(
  surfaces: T[],
  range: [number, number]
): (BaseUnit & UnitDivision & T)[] {
  return surfaces.map((surface, i) => {
    const { height, ...rest } = surface;
    const bottom = height;
    const top = bottom + surfaces[i + 1]?.height ?? range[1];
    const b_age = top;
    const t_age = bottom;
    return { top, bottom, b_age, t_age, ...rest };
  });
}

type HasUnitID = { unit_id: number };
function mergeUnitData<A extends HasUnitID, B extends HasUnitID>(
  sourceUnits: A[],
  result: B[]
): (A & B)[] {
  return result.map(d => {
    const foundMatch = sourceUnits.find(u => u.unit_id === d.unit_id);
    return { ...foundMatch, ...d };
  });
}

const BaseSection = (
  props: IColumnProps & { children: React.ReactNode; params: ColumnSpec }
) => {
  // Section with "squishy" time scale
  const { data = [], range = [0, 341.3], children, params } = props;
  let { pixelScale } = props;

  let divisions = buildDivisions(data, range);
  const unitData: UnitLong[] = useAPIResult("/units", params);
  if (unitData != null) {
    divisions = mergeUnitData(unitData, divisions);
  }

  const notesOffset = 100;

  return h("div.measured-section", [
    h(
      ColumnProvider,
      {
        divisions,
        range,
        pixelsPerMeter: 2
      },
      [
        h(
          ColumnSVG,
          { innerWidth: 200, padding: 20, paddingLeft: 40, paddingBottom: 30 },
          [
            h(ColumnAxis),
            h(
              GrainsizeLayoutProvider,
              {
                width: 80,
                grainsizeScaleStart: 40
              },
              [h(GeneralizedSectionColumn, [h(LithologyBoxes)])]
            ),
            children
          ]
        )
      ]
    ),
    children
  ]);
};

export function MeasuredSection(props) {
  return h(BaseSection, { ...props, data: columnData });
}
