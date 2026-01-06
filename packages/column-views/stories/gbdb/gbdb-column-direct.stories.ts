import h from "@macrostrat/hyper";
import { Box, useAPIResult } from "@macrostrat/ui-components";

import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  MergeSectionsMode,
  useLithologies,
} from "../../src";
import "@macrostrat/style-system";
import { useMemo } from "react";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useColumnSelection } from "../column-ui/utils";
import { Spinner } from "@blueprintjs/core";
import { convertGBDBUnitToMacrostrat, createFormationUnits } from "./utils";

const accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export default {
  title: "Column views/GBDB/Columns from GBDB API",
  component: GBDBColumn,
  description: "GBDB columns, directly loaded from GBDB web API",
  tags: ["!autodocs"],
  args: {
    axisType: ColumnAxisType.HEIGHT,
    showFormations: true,
    columnID: 4,
  },
  argTypes: {
    axisType: {
      options: ["age", "height"],
      control: { type: "radio" },
    },
  },
};

const apiBase = "https://www.geobiodiversity.com/api";

function useColumnGeoJSON() {
  /** Transform GBDB point data to GeoJSON */
  const res = useAPIResult(
    apiBase + "/assets/map/points/modern/Phanerozoic.json",
  ) as any[] | null;

  if (res == null) return [];

  let features = [];

  for (const d of res) {
    const [id, rest] = d.name.replace("section No(", "").split(") ");
    const section_id = Number(id);
    const section_name = rest;

    features.push({
      type: "Feature",
      id: section_id,
      properties: {
        color: d.color,
        section_name,
        name: d.name,
      },
      geometry: {
        type: "Point",
        coordinates: d.value.map(Number),
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function useSectionUnits(sectionID: number) {
  /** Fetch a list of units for a single section */
  const res = useAPIResult(apiBase + "/search/dataApi/unit/list", {
    section_id: `${sectionID}`,
  });
  console.log(res);
  return res?.result;
}

function Template(args) {
  return h(GBDBColumn, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Primary = Template.bind({});

function GBDBColumn({
  axisType = ColumnAxisType.HEIGHT,
  showFormations = true,
  columnID,
  setColumn,
}) {
  const columnGeoJSON = useColumnGeoJSON();

  const sectionData = useSectionUnits(columnID);

  const lithMap = useLithologies();

  const [units, omittedUnitsCount] = useMemo(() => {
    if (sectionData == null) return [null, 0];

    const lithNamesMap = new Map<string, number>();
    lithMap?.forEach((lith) => {
      lithNamesMap.set(lith.name.toLowerCase(), lith);
    });

    let units = sectionData.map((d) => {
      return convertGBDBUnitToMacrostrat(d, lithNamesMap);
    });

    // Sort units by increasing height
    units.sort((a, b) => b.b_pos - a.b_pos);

    if (showFormations) {
      units = units.map((u) => {
        return { ...u, column: 1 };
      });

      units.push(...createFormationUnits(units));
    }

    units = units.filter((d) => d.covered == false);

    const unitsCount = units.length;
    let removedUnits = 0;
    if (axisType == ColumnAxisType.AGE) {
      // Remove data without age constraints
      units = units.filter((d) => d.t_age != null && d.b_age != null);
      units = units.filter((d) => d.t_age != 0 && d.b_age != 0);
      removedUnits = units.length - unitsCount;
    }
    return [units, removedUnits];
  }, [showFormations, sectionData, lithMap, axisType]);

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
        h("h1", sectionData?.[0]?.section_name),
        h("div.right", [
          h("p.credit", [
            "Geobiodiversity Database: section ",
            h("code", `${sectionData?.[0].section_id}`),
          ]),
          h("p", "This view of GBDB columns comes directly from the GBDB API"),
          h.if(omittedUnitsCount > 0)(
            "p.omitted-notice",
            `${omittedUnitsCount} units omitted due to lack of age constraint`,
          ),
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
        h(ColumnInner, {
          units,
          columnID,
          axisType,
          showUnitPopover: true,
          targetUnitHeight: 50,
          unitComponent: ColoredUnitComponent,
          mergeSections:
            axisType == ColumnAxisType.HEIGHT
              ? MergeSectionsMode.ALL
              : MergeSectionsMode.OVERLAPPING,
          unitComponentProps: {
            nColumns: showFormations ? 2 : 1,
          },
        }),
        h(ColumnNavigationMap, {
          columns: columnGeoJSON?.features ?? [],
          style: { height: 500, width: 500 },
          mapPosition: undefined,
          center: [80, 36],
          zoom: 2.7,
          accessToken,
          selectedColumn: columnID,
          showLabels: true,
          showAdmin: true,
          showRoads: true,
          onSelectColumn(id) {
            console.log(id);
            setColumn(id);
          },
        }),
      ],
    ),
  ]);
}

function ColumnInner(props) {
  const { columnID, units, ...rest } = props;

  if (units == null || units.length == 0) return h(Spinner);

  const t_pos = Math.max(...units.map((u) => u.t_pos));
  const b_pos = Math.min(...units.map((u) => u.b_pos));

  return h(Column, { ...rest, units, t_pos, b_pos, key: columnID });
}
