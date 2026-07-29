import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import {
  useCorrelationLine,
  CorrelationColumnHeader,
  RemovableColumnHeader,
} from "./utils.ts";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  MergeSectionsMode,
  useCorrelationMapStore,
} from "../../src";
import { hyperStyled } from "@macrostrat/hyper";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
} from "@macrostrat/data-provider";

import styles from "./stories.module.sass";
import {
  CorrelationChart,
  CorrelationChartProps,
} from "../../src/correlation-chart/main.ts";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { EnvironmentColoredUnitComponent } from "../../src/units";
import { scaleLinear, scalePow } from "d3-scale";
import { MacrostratInteractionProvider } from "@macrostrat/data-components";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

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
  const domain = "https://dev.macrostrat.org";
  return h(
    MacrostratDataProvider,
    { baseURL: domain + "/api/v2" },
    h(
      MacrostratInteractionProvider,
      { linkDomain: domain },
      h(
        ColumnCorrelationProvider,
        {
          focusedLine,
          columns: null,
          projectID,
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
              //showLogo: false,
            }),
          ]),
        ]),
      ),
    ),
  );
}

function CorrelationDiagramWrapper(props: Omit<CorrelationChartProps, "data">) {
  /** This state management is a bit too complicated, but it does kinda sorta work */

  const fetch = useMacrostratFetch();

  // Sync focused columns with map
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );

  const columnUnits = useAsyncMemo(async () => {
    const col_ids = focusedColumns.map((col) => col.properties.col_id);
    return await fetchUnits(col_ids, fetch);
  }, [focusedColumns]);

  return h("div.correlation-diagram", [
    h(
      ErrorBoundary,
      h(OverlaysProvider, [
        h(CorrelationChart, { data: columnUnits, ...props }),
      ]),
    ),
  ]);
}

export default {
  title: "Column views/Correlation chart",
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
    collapseSmallUnconformities: true,
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
    projectID: {
      control: {
        type: "number",
      },
    },
    columnHeaderComponent: {
      control: false,
      table: { category: "Content" },
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

export const ColoredByEnvironment = Template.bind({});
ColoredByEnvironment.args = {
  unitComponent: EnvironmentColoredUnitComponent,
};

export const RestrictedAgeRange = Template.bind({});
RestrictedAgeRange.args = {
  t_age: 100,
  b_age: 300,
  focusedLine: "-114.29,42.74 -104.59,39.21",
};

export const WithFixedScale = Template.bind({});
WithFixedScale.args = {
  scale: scaleLinear().domain([0, 2500]).range([0, 1000]),
};

export const WithPowerScale = Template.bind({});
WithPowerScale.args = {
  scale: scalePow().exponent(0.3).domain([0, 2500]).range([0, 1000]),
};

export const WithPowerScaleMerged = Template.bind({});
WithPowerScaleMerged.args = {
  scale: scalePow().exponent(0.3).domain([0, 2500]).range([0, 1000]),
  mergeSections: MergeSectionsMode.ALL,
};

export const eODPCorrelationChart = Template.bind({});
eODPCorrelationChart.args = {
  focusedLine: "-125,38 -120,32",
  projectID: 3,
};

export const WithColumnHeaders = Template.bind({});
WithColumnHeaders.args = {
  columnHeaderComponent: CorrelationColumnHeader,
};
WithColumnHeaders.parameters = {
  docs: {
    description: {
      story:
        "Arbitrary content (here, the column name and ID) can be placed above " +
        "each column using the `columnHeaderComponent` prop. Headers stay " +
        "pinned to the top of the chart while scrolling.",
    },
  },
};

export const WideColumnSpacing = Template.bind({});
WideColumnSpacing.args = {
  columnSpacing: 30,
  columnWidth: 90,
  columnHeaderComponent: CorrelationColumnHeader,
};
WideColumnSpacing.parameters = {
  docs: {
    description: {
      story:
        "The `columnSpacing` prop controls the horizontal gap between columns. " +
        "Column headers remain aligned with their columns regardless of spacing.",
    },
  },
};

export const ColumnRemoval = Template.bind({});
ColumnRemoval.args = {
  columnHeaderComponent: RemovableColumnHeader,
};
ColumnRemoval.parameters = {
  docs: {
    description: {
      story:
        "Each column header has a close button. Removing a column from a " +
        "line-of-section selection converts it to a manual selection (a line " +
        "can no longer represent the arbitrary subset), so the map switches to " +
        "click-to-select mode.",
    },
  },
};
