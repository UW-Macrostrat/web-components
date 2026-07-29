import { Meta } from "@storybook/react-vite";
import { hyperStyled } from "@macrostrat/hyper";
import { useState } from "react";
import { Button, OverlaysProvider } from "@blueprintjs/core";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
} from "@macrostrat/data-provider";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { MacrostratInteractionProvider } from "@macrostrat/data-components";

import {
  CorrelationChart,
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useCorrelationMapStore,
} from "../../src";
import { CorrelationColumnHeader } from "./utils.ts";
import styles from "./stories.module.sass";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

function TimescaleZoomStoryUI({ focusedLine, projectID, ...rest }: any) {
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
        h(TimescaleZoomLayout, rest),
      ),
    ),
  );
}

function TimescaleZoomLayout(props) {
  const fetch = useMacrostratFetch();
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );
  const colIDs = focusedColumns.map((col) => col.properties.col_id);

  const columnUnits = useAsyncMemo(async () => {
    if (colIDs.length === 0) return [];
    return await fetchUnits(colIDs, fetch);
  }, [colIDs.join(",")]);

  // Age range [t_age, b_age] to zoom to; null = full range
  const [ageRange, setAgeRange] = useState<[number, number] | null>(null);

  const onClickTimescaleInterval = (_event, data) => {
    const interval = data?.interval;
    if (interval == null) return;
    const { eag, lag } = interval; // early (older) and late (younger) ages
    // Buffer around the interval so neighboring time can still be traversed
    const buffer = Math.max((eag - lag) * 0.25, 5);
    setAgeRange([Math.max(lag - buffer, 0), eag + buffer]);
  };

  return h("div.side-panel-ui", [
    h(
      "div.chart-scroll",
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            columnHeaderComponent: CorrelationColumnHeader,
            onClickTimescaleInterval,
            t_age: ageRange?.[0],
            b_age: ageRange?.[1],
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
      h("div.picker-help", [
        h("p", "Click a timescale interval (left axis) to zoom to that span."),
        h(Button, {
          small: true,
          icon: "zoom-to-fit",
          disabled: ageRange == null,
          onClick: () => setAgeRange(null),
          text: "Reset zoom",
        }),
      ]),
    ]),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: TimescaleZoomStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Click an interval on the timescale axis to zoom the chart to that " +
          "time span (plus a buffer so adjacent intervals remain reachable). " +
          "Use “Reset zoom” to return to the full range.",
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
} as Meta<typeof TimescaleZoomStoryUI>;

export const TimescaleZoom = {};
