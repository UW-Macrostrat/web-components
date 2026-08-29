import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import {
  CorrelationColumnHeader,
  useCorrelationChartUnits,
  useCorrelationLine,
} from "./utils.ts";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useColumnMapLink,
} from "@macrostrat/map-views";
import { hyperStyled } from "@macrostrat/hyper";
import { MacrostratDataProvider } from "@macrostrat/data-provider";

import styles from "./stories.module.sass";
import {
  CorrelationChart,
  CorrelationChartProps,
  MergeSectionsMode,
} from "../../src";
import { ErrorBoundary } from "@macrostrat/ui-components";
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
  // Link column hover/click to the map (highlight on hover, frame on click)
  const columnMapLink = useColumnMapLink();
  const data = useCorrelationChartUnits();

  return h("div.correlation-diagram", [
    h(
      ErrorBoundary,
      h(OverlaysProvider, [
        h(CorrelationChart, {
          data,
          ...props,
          ...columnMapLink,
        }),
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
    minPixelScale: {
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
