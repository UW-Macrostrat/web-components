import data from "./gbdb-section-4.json";

import h from "@macrostrat/hyper";
import { Box, FlexRow, Spacer, useAPIResult } from "@macrostrat/ui-components";
import { ColoredUnitComponent, Column, MergeSectionsMode } from "../src";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { ColumnProps } from "../src";
import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";
import { UnitLong } from "@macrostrat/api-types";
import { useMemo } from "react";
import { ColumnAxisType } from "@macrostrat/column-components";

export default {
  title: "Column views/GBDB columns",
  component: GBDBColumn,
  description: "A column rendered using static units",
  args: {
    axisType: ColumnAxisType.HEIGHT,
  },
  argTypes: {
    axisType: {
      options: ["age", "height"],
      control: { type: "radio" },
    },
  },
};

function convert(unit: any): UnitLong {
  const {
    unit_id,
    section_id,
    unit_thickness,
    unit_sum,
    lithology1,
    lithology2,
    max_ma,
    min_ma,
  } = unit;

  let atts = undefined;
  if (lithology2 != null && lithology2 !== "") {
    atts = [lithology2];
  }

  return {
    unit_id,
    col_id: section_id,
    unit_name: `Unit ${unit_id}`,
    lith: [{ name: lithology1, atts }],
    b_pos: unit_sum - unit_thickness,
    t_pos: unit_sum,
    min_thick: unit_thickness,
    max_thick: unit_thickness,
    b_age: max_ma,
    t_age: min_ma,
    environ: [],
    covered: lithology1 == "covered",
  };
}

function stackUnitsByAge(units: UnitLong[]): UnitLong[] {
  /** Find groups of units with same top and bottom age, and stack them */
  const used = new Set<number>();
  const newUnits: UnitLong[] = [];
  for (let i = 0; i < units.length; i++) {
    if (used.has(i)) continue;
    const u1 = units[i];
    const group = [u1];
    used.add(i);
    for (let j = i + 1; j < units.length; j++) {
      if (used.has(j)) continue;
      const u2 = units[j];
      if (u1.t_age === u2.t_age && u1.b_age === u2.b_age) {
        group.push(u2);
        used.add(j);
      }
    }
    if (group.length === 1) {
      newUnits.push(u1);
    } else {
      // Stack the units in the group
      let u0 = group[0];
      const totalThickness = u0.b_age - u0.t_age;
      const fracThickness = totalThickness / group.length;
      let cumulativeThickness = 0;
      // Sort group by height
      group.sort((a, b) => (b.t_pos ?? 0) - (a.t_pos ?? 0));

      for (const u of group) {
        const newTAge = u.t_age + cumulativeThickness;
        const newBAge = newTAge + fracThickness;
        cumulativeThickness += fracThickness;
        newUnits.push({
          ...u,
          t_age: newTAge,
          b_age: newBAge,
        });
      }
    }
  }
  return newUnits;
}

export function GBDBColumn({ axisType = ColumnAxisType.HEIGHT }) {
  const units = useMemo(() => {
    console.log("Column data", data);

    const units: UnitLong[] = stackUnitsByAge(data.map(convert)).filter(
      (d) => d.covered == false,
    );

    console.log("Converted units", units);
    return units;
  }, []);

  return h("div", [
    h(
      Box,
      {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
      },
      [
        h("h1", data[0].section_name),
        h("p.credit", [
          "Geobiodiversity Database: section ",
          h("code", `${data[0].section_id}`),
        ]),
      ],
    ),
    h(Column, {
      units,
      axisType,
      showUnitPopover: true,
      targetUnitHeight: 50,
      unitComponent: ColoredUnitComponent,
      mergeSections: MergeSectionsMode.ALL,
    }),
  ]);
}
