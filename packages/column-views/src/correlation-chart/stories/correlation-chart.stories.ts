import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { useArgs } from "@storybook/client-api";
import { useCallback, useEffect } from "react";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  UnitSelectionProvider,
  useCorrelationMapStore,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";

import styles from "./stories.module.sass";
import { LineString } from "geojson";
import {
  CorrelationChart,
  useCorrelationChartData,
} from "../correlation-chart";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { useCorrelationDiagramStore } from "../state";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const apiV2Prefix = "https://macrostrat.org/api/v2";

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
}) {
  return h(
    ColumnCorrelationProvider,
    {
      focusedLine: convertLineToGeoJSON(focusedLine),
      baseURL: apiV2Prefix,
      onSelectColumns(cols, line) {
        setFocusedLine(line?.coordinates);
      },
    },
    h(
      UnitSelectionManager,
      h("div.correlation-ui", [
        h("div.correlation-container", [h(CorrelationDiagramWrapper)]),
        h("div.right-column", [
          h(ColumnCorrelationMap, {
            accessToken: mapboxToken,
            className: "correlation-map",
            showLogo: false,
          }),
        ]),
      ])
    )
  );
}

function UnitSelectionManager({ children }) {
  const selectedUnit = useCorrelationDiagramStore(
    (state) => state.selectedUnit
  );
  const setSelectedUnit = useCorrelationDiagramStore(
    (state) => state.setSelectedUnit
  );

  return h(
    UnitSelectionProvider,
    {
      unit: selectedUnit,
      setUnit: setSelectedUnit,
    },
    children
  );
}

function CorrelationDiagramWrapper() {
  /** This state management is a bit too complicated, but it does kinda sorta work */
  const chartData = useCorrelationChartData();

  const setFocusedColumns = useCorrelationDiagramStore(
    (s) => s.setSelectedColumns
  );

  // Sync focused columns with map
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns
  );

  useEffect(() => {
    setFocusedColumns(focusedColumns);
  }, [focusedColumns]);

  console.log("Correlation chart data", chartData);

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

export default {
  title: "Column views/Correlation chart",
  component: CorrelationStoryUI,
  parameters: {
    layout: "fullscreen",
  },
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

function useCorrelationLine() {
  const [{ focusedLine, selectedUnit }, updateArgs] = useArgs();
  const setFocusedLine = (line) => {
    updateArgs({ focusedLine: line });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs]
  );

  return {
    focusedLine,
    setFocusedLine,
    selectedUnit,
    setSelectedUnit,
  };
}

function Template(args) {
  return h(CorrelationStoryUI, {
    ...args,
    ...useCorrelationLine(),
  });
}

export const Primary = Template.bind({});
