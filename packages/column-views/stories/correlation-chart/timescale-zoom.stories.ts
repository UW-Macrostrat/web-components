import { Meta } from "@storybook/react-vite";
import { hyperStyled } from "@macrostrat/hyper";
import { useState } from "react";
import { OverlaysProvider } from "@blueprintjs/core";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
} from "@macrostrat/data-provider";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import {
  MacrostratInteractionProvider,
  IntervalTag,
  type IntervalShort,
} from "@macrostrat/data-components";

import {
  CorrelationChart,
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useCorrelationMapStore,
  useColumnMapLink,
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
  const columnMapLink = useColumnMapLink();
  const colIDs = focusedColumns.map((col) => col.properties.col_id);

  const columnUnits = useAsyncMemo(async () => {
    if (colIDs.length === 0) return [];
    return await fetchUnits(colIDs, fetch);
  }, [colIDs.join(",")]);

  // The interval we've zoomed to (null = full range)
  const [zoom, setZoom] = useState<{
    interval: IntervalShort;
    t_age: number;
    b_age: number;
  } | null>(null);

  const onClickTimescaleInterval = (_event, data) => {
    const interval = data?.interval;
    if (interval == null) return;
    const { eag, lag } = interval; // early (older) and late (younger) ages
    // Buffer around the interval so neighboring time can still be traversed
    const buffer = Math.max((eag - lag) * 0.25, 5);
    setZoom({
      interval: {
        id: interval.int_id ?? interval.oid,
        name: interval.nam,
        color: interval.col,
        b_age: eag,
        t_age: lag,
        rank: interval.lvl,
      },
      t_age: Math.max(lag - buffer, 0),
      b_age: eag + buffer,
    });
  };

  return h("div.side-panel-ui", [
    h("div.chart-scroll", [
      zoom != null
        ? h(
            "div.zoom-pill",
            h(IntervalTag, {
              interval: zoom.interval,
              prefix: h(
                "button.clear-zoom",
                {
                  title: "Clear zoom",
                  onClick(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    setZoom(null);
                  },
                },
                "×",
              ),
            }),
          )
        : null,
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            columnHeaderComponent: CorrelationColumnHeader,
            onClickTimescaleInterval,
            t_age: zoom?.t_age,
            b_age: zoom?.b_age,
            ...columnMapLink,
            ...props,
          }),
        ]),
      ),
    ]),
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
        h("p", "Clear the pill at the top-left to return to the full range."),
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
          "A clearable pill at the top-left shows the current zoom. " +
          "`minPixelScale` sets the px/myr floor at which the column stops " +
          "shrinking and starts expanding, so a wide age range never collapses " +
          "into a sliver.",
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
    // Floor on px/myr so a wide range doesn't render as a thin column
    minPixelScale: 1,
    minSectionHeight: 60,
  },
  argTypes: {
    minPixelScale: { control: { type: "number" } },
    minSectionHeight: { control: { type: "number" } },
    targetUnitHeight: { control: { type: "number" } },
  },
} as Meta<typeof TimescaleZoomStoryUI>;

export const TimescaleZoom = {};
