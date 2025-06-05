import h from "@macrostrat/hyper";

import { ComponentMeta } from "@storybook/react";
import { BasicUnitComponent, Column } from "../src";
import { ColumnAxisType } from "@macrostrat/column-components";

export default {
  title: "Column views/Column creation",
  component: Column,
  description: "A column rendered using static units",
} as ComponentMeta<typeof Column>;

export function EmptyColumn() {
  return h("div", [
    h(Column, {
      units: [
        {
          unit_id: -1,
          empty: true,
          unit_name: "Empty Unit",
          t_pos: 200,
          b_pos: 0,
        },
      ],
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

export function ColumnWithSingleUnit() {
  return h("div", [
    h(Column, {
      units: [
        {
          unit_id: -1,
          empty: true,
          unit_name: "Empty Unit",
          t_pos: 200,
          b_pos: 0,
        },
        {
          unit_id: 1,
          unit_name: "Single Unit",
          t_pos: 70,
          b_pos: 50,
          color: "#f0e68c",
        },
      ],
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

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
    }),
  ]);
}
