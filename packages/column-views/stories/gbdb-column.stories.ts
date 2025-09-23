import data from "./gbdb-section-4.json";

import h from "@macrostrat/hyper";
import { FlexRow, Spacer, useAPIResult } from "@macrostrat/ui-components";
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
      options: ["age", "height", "depth"],
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

  if (lithology1 == "covered") {
    return null;
  }

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
  };
}

export function GBDBColumn({ axisType = ColumnAxisType.HEIGHT }) {
  const units = useMemo(() => {
    console.log("Column data", data);

    const units: UnitLong[] = data.map(convert).filter((d) => d != null);

    console.log("Converted units", units);
    return units;
  }, []);

  return h(Column, {
    units,
    axisType,
    showUnitPopover: true,
    targetUnitHeight: 50,
    unitComponent: ColoredUnitComponent,
    mergeSections: MergeSectionsMode.ALL,
  });
}
