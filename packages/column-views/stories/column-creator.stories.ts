import h from "@macrostrat/hyper";

import { ComponentMeta } from "@storybook/react";
import { BasicUnitComponent, Column } from "../src";
import { ColumnAxisType } from "@macrostrat/column-components";

export default {
  title: "Column views/Column creation",
  component: Column,
  description: "A column rendered using static units",
} as ComponentMeta<typeof Column>;

const demoUnits = [
  {
    unit_id: 1,
    unit_name: "Unit A",
    t_pos: 100,
    b_pos: 0,
    color: "#f0e68c",
  },
  {
    unit_id: 2,
    unit_name: "Unit B",
    t_pos: 200,
    b_pos: 100,
    color: "#708090",
  },
];

export function BasicColumn() {
  return h("div", [
    h(Column, {
      units: demoUnits,
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

export function ColumnCreator() {
  return h(FlexRow, { gap: "1em" }, [
    h(Column, {
      units: demoUnits,
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
      onClick(props) {
        console.log("Column clicked!", props);
      },
    }),
  ]);
}
