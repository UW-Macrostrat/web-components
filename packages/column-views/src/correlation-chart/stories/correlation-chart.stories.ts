import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { useArgs } from "@storybook/client-api";
import { useCallback } from "react";
import {
  ColoredUnitComponent,
  Column,
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";

import { Spinner } from "@blueprintjs/core";
import { useColumnBasicInfo, useColumnUnits } from "./utils";
import styles from "./stories.module.sass";
import { LineString } from "geojson";
import {
  CorrelationChart,
  useCorrelationChartData,
} from "../correlation-chart";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const apiV2Prefix = "https://macrostrat.org/api/v2";

const h = hyperStyled(styles);

function CorrelationStoryUI({
  focusedLine,
  columnID,
  setColumn,
  selectedUnit,
  setSelectedUnit,
  inProcess,
  projectID,
  ...rest
}) {
  return h(
    ColumnCorrelationProvider,
    { focusedLine: convertLineToGeoJSON(focusedLine), baseURL: apiV2Prefix },
    h("div.column-ui", [
      h(
        "div.column-container",
        h(ColumnCore, {
          col_id: columnID,
          selectedUnit,
          setSelectedUnit,
          inProcess,
          ...rest,
        })
      ),
      h("div.right-column", [
        h(ColumnCorrelationMap, {
          accessToken: mapboxToken,
          className: "correlation-map",
          showLogo: false,
          focusedLine: null,
        }),
      ]),
    ])
  );
}

function CorrelationDiagramWrapper() {
  const chartData = useCorrelationChartData();

  return h("div.correlation-diagram", [
    h(
      ErrorBoundary,
      h(OverlaysProvider, [h(CorrelationChart, { data: chartData })])
    ),
  ]);
}

function convertLineToGeoJSON(line: [number, number][]): LineString | null {
  if (line == null) return null;
  return {
    type: "LineString",
    coordinates: line,
  };
}

function ColumnCore({
  col_id,
  inProcess,
  selectedUnit,
  setSelectedUnit,
  ...rest
}) {
  const units = useColumnUnits(col_id, inProcess);
  const info = useColumnBasicInfo(col_id, inProcess);

  if (units == null || info == null) {
    return h(Spinner);
  }

  return h("div.column-container", [
    h("h2", info.col_name),
    h(Column, {
      key: col_id,
      units,
      selectedUnit,
      onUnitSelected: (unit_id) => {
        setSelectedUnit(unit_id);
      },
      unconformityLabels: true,
      keyboardNavigation: true,
      columnWidth: 300,
      showUnitPopover: true,
      width: 450,
      unitComponent: ColoredUnitComponent,
      ...rest,
    }),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: CorrelationStoryUI,
  args: {
    focusedLine: [
      [-100, 45],
      [-90, 50],
    ],
    columnID: 432,
    axisType: "age",
    collapseSmallUnconformities: false,
    targetUnitHeight: 20,
  },
  argTypes: {
    columnID: {
      control: {
        type: "number",
      },
    },
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
    axisType: {
      options: ["age", "ordinal", "depth"],
      control: { type: "radio" },
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
} as Meta<CorrelationStoryUI>;

function useColumnSelection() {
  const [{ columnID, selectedUnit }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs]
  );

  return {
    columnID,
    selectedUnit,
    setColumn,
    setSelectedUnit,
  };
}

function Template(args) {
  return h(CorrelationStoryUI, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Primary = Template.bind({});
