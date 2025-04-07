import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { useArgs } from "@storybook/client-api";
import { useCallback, useMemo } from "react";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useCorrelationMapStore,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";

import styles from "./stories.module.sass";
import { CorrelationChart, CorrelationChartProps } from "../correlation-chart";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { getCorrelationUnits } from "../utils";
import { parseLineFromString, stringifyLine } from "../hash-string";
import { AgeScaleMode, buildColumnData } from "../prepare-data";

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
      focusedLine,
      baseURL: apiV2Prefix,
      onSelectColumns(cols, line) {
        setFocusedLine(line);
      },
    },
    h("div.correlation-ui", [
      h("div.correlation-container", h(CorrelationDiagramWrapper, rest)),
      h("div.right-column", [
        h(ColumnCorrelationMap, {
          accessToken: mapboxToken,
          className: "correlation-map",
          showLogo: false,
        }),
      ]),
    ])
  );
}

function CorrelationDiagramWrapper(props: Omit<CorrelationChartProps, "data">) {
  /** This state management is a bit too complicated, but it does kinda sorta work */

  const { targetUnitHeight = 10, ageMode = AgeScaleMode.Broken } = props;

  // Sync focused columns with map
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns
  );

  const columnUnits = useAsyncMemo(async () => {
    return await getCorrelationUnits(focusedColumns);
  }, [focusedColumns]);

  const chartData = useMemo(() => {
    if (!columnUnits) return null;
    return buildColumnData(columnUnits, {
      targetUnitHeight,
      ageMode,
    });
  }, [columnUnits, targetUnitHeight, ageMode]);

  if (!chartData || chartData.columnData.length == 0) return null;

  return h("div.correlation-diagram", [
    h(
      ErrorBoundary,
      h(OverlaysProvider, [h(CorrelationChart, { data: chartData, ...props })])
    ),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: CorrelationStoryUI,
  parameters: {
    layout: "fullscreen",
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
} as Meta<CorrelationStoryUI>;

function useCorrelationLine() {
  const [{ focusedLine, selectedUnit }, updateArgs] = useArgs();
  const setFocusedLine = (line) => {
    updateArgs({ focusedLine: stringifyLine(line) });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs]
  );

  return {
    focusedLine: parseLineFromString(focusedLine),
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
