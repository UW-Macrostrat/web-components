import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useCorrelationMapStore,
  useColumnMapLink,
  UnitDetailsPanel,
  UnitDetailsFeature,
  CorrelationChart,
} from "../../src";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
} from "@macrostrat/data-provider";
import { useState } from "react";
import type { BaseUnit } from "@macrostrat/api-types";
import { CorrelationColumnHeader } from "./utils.ts";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { MacrostratInteractionProvider } from "@macrostrat/data-components";
import h from "./stories.module.sass";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const detailsPanelFeatures = new Set([
  UnitDetailsFeature.AdjacentUnits,
  UnitDetailsFeature.OutcropType,
  UnitDetailsFeature.DepthRange,
  UnitDetailsFeature.ColumnName,
]);

function FixedPanelStoryUI({ focusedLine, projectID, ...rest }: any) {
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
          onSelectColumns() {},
        },
        h(FixedPanelLayout, rest),
      ),
    ),
  );
}

function FixedPanelLayout(props) {
  /** A correlation diagram where the map and unit-details panel are docked in a
   * fixed right column, rather than floating in a popover over the chart. */
  const fetch = useMacrostratFetch();

  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );
  const columnMapLink = useColumnMapLink();

  const columnUnits = useAsyncMemo(async () => {
    const col_ids = focusedColumns.map((col) => col.properties.col_id);
    return await fetchUnits(col_ids, fetch);
  }, [focusedColumns]);

  // Selection is lifted out of the chart so the details panel can live in the
  // right column, outside of the chart's own layout.
  const [selectedUnit, setSelectedUnit] = useState<BaseUnit | null>(null);

  // Side-by-side layout: chart on the left, docked panels on the right
  return h("div.side-panel-ui", [
    h(
      "div.chart-scroll",
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            // Disable the floating popover — details render in the side column
            showUnitPopover: false,
            // Selection stays internal to the chart; mirror it into the panel
            onUnitSelected: (_id, unit) => setSelectedUnit(unit),
            columnHeaderComponent: CorrelationColumnHeader,
            ...columnMapLink,
            ...props,
          }),
        ]),
      ),
    ),
    h("div.side-panel", [
      h(
        "div.map-panel",
        h(ColumnCorrelationMap, {
          accessToken: mapboxToken,
          className: "correlation-map",
        }),
      ),
      h(
        "div.details-panel",
        selectedUnit == null
          ? h("p.details-placeholder", "Select a unit to see its details.")
          : h(UnitDetailsPanel, {
              unit: selectedUnit,
              features: detailsPanelFeatures,
              onClose: () => setSelectedUnit(null),
            }),
      ),
    ]),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: FixedPanelStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Correlation chart with the map and unit-details panel docked in a " +
          "fixed right column instead of floating over the chart.",
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  args: {
    focusedLine: {
      type: "LineString",
      coordinates: [
        [-114.29, 42.74],
        [-104.59, 39.21],
      ],
    },
    columnSpacing: 10,
    columnWidth: 100,
    collapseSmallUnconformities: true,
    targetUnitHeight: 20,
  },
} as Meta<typeof FixedPanelStoryUI>;

export const FixedRightColumnPanels = {};
