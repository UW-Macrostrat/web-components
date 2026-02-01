import h from "@macrostrat/hyper";
import { Box, useAPIResult } from "@macrostrat/ui-components";

import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  MergeSectionsMode,
} from "../../src";
import "@macrostrat/style-system";
import { UnitLong } from "@macrostrat/api-types";
import { useMemo } from "react";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useColumnSelection } from "../column-ui/utils";
import { Spinner } from "@blueprintjs/core";
import { createFormationUnits, convertGBDBUnitToMacrostrat } from "./utils";
import { useLithologies } from "@macrostrat/data-provider";

const accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export default {
  title: "Column views/GBDB/Columns from Macrostrat API",
  component: GBDBColumn,
  description: "GBDB columns from Macrostrat API",
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

function useColumnGeoJSON(view: string = "gbdb_section_geojson") {
  const res = useAPIResult("https://dev.macrostrat.org/api/pg/" + view);
  return res?.[0]?.geojson;
}

function useColumnUnits(sectionID: number) {
  return useAPIResult(
    "https://dev.macrostrat.org/api/pg/gbdb_strata_with_age_model",
    {
      section_id: `eq.${sectionID}`,
    },
  );
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

  const sectionData = useColumnUnits(columnID);

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
        h("p.credit", [
          "Geobiodiversity Database: section ",
          h("code", `${sectionData?.[0].section_id}`),
        ]),
        h.if(omittedUnitsCount > 0)(
          "p.omitted-notice",
          `${omittedUnitsCount} units omitted due to lack of age constraint`,
        ),
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
          key: columnID,
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
  if (props.units == null) return h(Spinner);

  return h(Column, props);
}

function SummaryTemplate(args) {
  return h(GBDBSummaryColumn, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Summary = SummaryTemplate.bind({});

function GBDBSummaryColumn({ showFormations = true, columnID, setColumn }) {
  const columnGeoJSON = useColumnGeoJSON("gbdb_summary_columns");

  const sectionData = useAPIResult(
    "https://macrostrat.local/api/pg/gbdb_summary_units",
    {
      col_id: `eq.${columnID}`,
    },
  );

  const units = sectionData;

  return h("div", [
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
          axisType: ColumnAxisType.AGE,
          showUnitPopover: true,
          targetUnitHeight: 50,
          unitComponentProps: {
            nColumns: 1,
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
            setColumn(id);
          },
        }),
      ],
    ),
  ]);
}
