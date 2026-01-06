import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  ColumnData,
  fetchUnits,
  useCorrelationMapStore,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";

import styles from "./gbdb.module.sass";
import { CorrelationChart, CorrelationChartProps } from "../../src";
import {
  ErrorBoundary,
  useAPIResult,
  useAsyncMemo,
} from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { useCorrelationLine } from "../../src/correlation-chart/stories/utils";
import { UnitLong } from "@macrostrat/api-types";

const accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

function CorrelationStoryUI({
  focusedLine,
  setFocusedLine,
  columnID,
  setColumn,
  selectedUnit,
  setSelectedUnit,
  inProcess,
  projectID,
  ...rest
}: any) {
  const columns = useColumnGeoJSON();

  console.log("Columns", columns);

  return h(
    ColumnCorrelationProvider,
    {
      focusedLine,
      columns,
      onSelectColumns(cols, line) {
        setFocusedLine(line);
      },
    },
    h("div.correlation-ui", [
      h("div.correlation-container", h(CorrelationDiagramWrapper, rest)),
      h("div.right-column", [
        h(ColumnCorrelationMap, {
          accessToken,
          className: "correlation-map",
          //showLogo: false,
        }),
      ]),
    ]),
  );
}

function useColumnGeoJSON(view: string = "gbdb_summary_columns") {
  const res = useAPIResult("https://macrostrat.local/api/pg/" + view);
  return res?.[0]?.geojson?.features;
}

async function fetchGBDBUnits(columns: number[]): Promise<ColumnData[]> {
  console.log(columns);
  const _columns = Array.from(new Set(columns));
  if (_columns.length == 0) {
    return [];
  }
  const col_ids = _columns.join(",");

  const unitData = await fetch(
    `https://macrostrat.local/api/pg/gbdb_summary_units?col_id=in.(${col_ids})`,
  ).then((res) => res.json());

  // Group by column ID
  const colMap: { [key: number]: UnitLong[] } = {};
  for (const unit of unitData) {
    const col_id = unit.col_id;
    if (!(col_id in colMap)) {
      colMap[col_id] = [];
    }
    colMap[col_id].push(unit);
  }

  return Object.entries(colMap).map(([colID, units]) => ({
    columnID: parseInt(colID),
    units,
  }));
}

function CorrelationDiagramWrapper(props: Omit<CorrelationChartProps, "data">) {
  /** This state management is a bit too complicated, but it does kinda sorta work */

  // Sync focused columns with map
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );

  const columnUnits = useAsyncMemo(async () => {
    const col_ids = focusedColumns.map((col) => col.properties.col_id);
    return await fetchGBDBUnits(col_ids);
  }, [focusedColumns]);

  return h("div.correlation-diagram", [
    h(
      ErrorBoundary,
      h(OverlaysProvider, [
        h(CorrelationChart, {
          data: columnUnits,
          nInternalColumns: 1,
          ...props,
        }),
      ]),
    ),
  ]);
}

export default {
  title: "Column views/GBDB/Correlation chart",
  component: CorrelationStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Correlation chart for Macrostrat columns",
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  args: {
    focusedLine: "-100,45 -90,50",
    columnSpacing: 0,
    columnWidth: 100,
    collapseSmallUnconformities: false,
    targetUnitHeight: 20,
  },
  argTypes: {
    selectedUnit: {
      control: {
        type: "number",
      },
    },
    t_age: {
      control: {
        type: "number",
      },
    },
    b_age: {
      control: {
        type: "number",
      },
    },
    columnSpacing: {
      control: {
        type: "number",
      },
    },
    columnWidth: {
      control: {
        type: "number",
      },
    },
    mergeSections: {
      options: ["all", "overlapping", null],
      control: { type: "radio" },
    },
    pixelScale: {
      control: {
        type: "number",
      },
    },
    collapseSmallUnconformities: {
      control: {
        type: "boolean",
      },
    },
    minSectionHeight: {
      control: {
        type: "number",
      },
    },
    targetUnitHeight: {
      control: {
        type: "number",
      },
    },
    showLabelColumn: {
      control: {
        type: "boolean",
      },
    },
    maxInternalColumns: {
      control: {
        type: "number",
      },
    },
  },
} as Meta<typeof CorrelationStoryUI>;

function Template(args) {
  return h(CorrelationStoryUI, {
    ...args,
    ...useCorrelationLine(),
  });
}

export const Primary = Template.bind({});
