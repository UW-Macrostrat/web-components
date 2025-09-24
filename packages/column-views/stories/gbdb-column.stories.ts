import data from "./gbdb-all.json";

import h from "@macrostrat/hyper";
import { Box, FlexRow, Spacer, useAPIResult } from "@macrostrat/ui-components";

import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  MergeSectionsMode,
} from "../src";

const accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import { ColumnProps } from "../src";
import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";
import { UnitLong } from "@macrostrat/api-types";
import { useMemo } from "react";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useColumnSelection } from "./column-ui/utils";

export default {
  title: "Column views/GBDB columns",
  component: GBDBColumn,
  description: "A column rendered using static units",
  args: {
    axisType: ColumnAxisType.HEIGHT,
    showFormations: true,
    sectionID: 4,
  },
  argTypes: {
    axisType: {
      options: ["age", "height"],
      control: { type: "radio" },
    },
  },
};

function buildColumnGeoJSON() {
  const colMap = new Map<number, any>();
  for (const d of data) {
    const { section_id, section_name, lng, lat } = d;
    if (!colMap.has(section_id)) {
      colMap.set(section_id, {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          id: section_id,
          col_id: section_id,
          col_name: section_name,
          n_units: 0,
        },
        id: section_id,
      });
    }
    const col = colMap.get(section_id);
    col.properties.n_units += 1;
  }

  return {
    type: "FeatureCollection",
    features: Array.from(colMap.values()),
  };
}

export function GBDBColumn({
  axisType = ColumnAxisType.HEIGHT,
  showFormations = true,
}) {
  const columnGeoJSON = useMemo(() => buildColumnGeoJSON(), []);

  const { columnID = 4, setColumn } = useColumnSelection();

  const sectionData = useMemo(() => {
    return data.filter((d) => d.section_id === columnID);
  }, [columnID]);
  const units = useMemo(() => {
    console.log("Column data", sectionData);

    let units = stackUnitsByAge(sectionData.map(convert));

    if (showFormations) {
      units = units.map((u) => {
        return { ...u, column: 1 };
      });

      units.push(...createFormationUnits(units));
    }

    units = units.filter((d) => d.covered == false);

    console.log("Converted units", units);
    return units;
  }, [showFormations, sectionData]);

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
        h("h1", sectionData[0].section_name),
        h("p.credit", [
          "Geobiodiversity Database: section ",
          h("code", `${sectionData[0].section_id}`),
        ]),
      ],
    ),
    h(
      Box,
      {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "start",
      },
      [
        h(Column, {
          units,
          axisType,
          showUnitPopover: true,
          targetUnitHeight: 50,
          unitComponent: ColoredUnitComponent,
          mergeSections: MergeSectionsMode.ALL,
          unitComponentProps: {
            nColumns: showFormations ? 2 : 1,
          },
        }),
        h(ColumnNavigationMap, {
          columns: columnGeoJSON.features,
          style: { height: 400, width: 400 },
          mapPosition: undefined,
          center: [80, 36],
          zoom: 2.7,
          accessToken,
          selectedColumn: columnID,
          onSelectColumn(id) {
            console.log(id);
            setColumn(id);
          },
        }),
      ],
    ),
  ]);
}

function convert(unit: any): UnitLong {
  const {
    unit_id,
    section_id,
    unit_thickness,
    unit_sum,
    lithology1,
    lithology2,
    paleoenvironment,
    max_ma,
    min_ma,
  } = unit;

  let { formation, member, group } = unit;
  if (formation == null || formation === "") formation = undefined;
  if (member == null || member === "") member = undefined;
  if (group == null || group === "") group = undefined;

  let atts = undefined;
  if (lithology2 != null && lithology2 !== "") {
    atts = [lithology2];
  }

  let environ = [];
  if (paleoenvironment != null && paleoenvironment !== "") {
    environ = [{ name: paleoenvironment }];
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
    Fm: formation,
    Mbr: member,
    Gp: group,
    environ,
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

function createFormationUnits(units: UnitLong[]): UnitLong[] {
  // Create a new array of units condensed on formation names
  const formationMap = new Map<string, UnitLong>();
  const unitsWithFormation = units.filter((u) => u.Fm != null);

  let uid = -1;
  for (const u of unitsWithFormation) {
    const formationName = u.Fm;
    if (!formationMap.has(formationName)) {
      formationMap.set(formationName, {
        ...u,
        lith: [],
        environ: [],
        unit_id: uid, // Indicate it's a formation unit
        unit_name: formationName + " Formation",
        column: 0,
      });
      uid -= 1;
    } else {
      const existing = formationMap.get(formationName)!;
      // Update the existing formation unit to extend its age range
      existing.t_age = Math.min(existing.t_age, u.t_age);
      existing.b_age = Math.max(existing.b_age, u.b_age);
      existing.min_thick += u.min_thick;
      existing.max_thick += u.max_thick;
      existing.t_pos = Math.max(existing.t_pos, u.t_pos);
      existing.b_pos = Math.min(existing.b_pos, u.b_pos);
    }
  }

  return Array.from(formationMap.values()).sort((a, b) => b.b_age - a.b_age);
}
