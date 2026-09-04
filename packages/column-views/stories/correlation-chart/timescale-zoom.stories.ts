import { Meta } from "@storybook/react-vite";
import { hyperStyled } from "@macrostrat/hyper";
import { useState } from "react";
import { OverlaysProvider } from "@blueprintjs/core";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import { ErrorBoundary } from "@macrostrat/ui-components";
import {
  MacrostratInteractionProvider,
  type IntervalShort,
} from "@macrostrat/data-components";

import {
  AgeWindowTag,
  CorrelationChart,
  intervalShortFromTimescale,
} from "../../src";
import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useColumnMapLink,
} from "@macrostrat/map-views";
import { CorrelationColumnHeader, useCorrelationChartUnits } from "./utils.ts";
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
  const data = useCorrelationChartUnits();

  const columnMapLink = useColumnMapLink();

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
      interval: intervalShortFromTimescale(interval),
      t_age: Math.max(lag - buffer, 0),
      b_age: eag + buffer,
    });
  };

  return h("div.side-panel-ui", [
    h(
      "div.chart-scroll",
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data,
            columnHeaderComponent: CorrelationColumnHeader,
            // Show the current zoom as a pill above the timescale axis
            axisTopContent: h(ZoomPill, {
              zoom,
              onClear: () => setZoom(null),
            }),
            timescaleIntervalStyle: (interval) => {
              if (zoom != null && interval.int_id === zoom.interval.id) {
                return { fontWeight: "bold" };
              }
              return {};
            },
            onClickTimescaleInterval,
            t_age: zoom?.t_age,
            b_age: zoom?.b_age,
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
      h("div.picker-help", [
        h("p", "Click a timescale interval (left axis) to zoom to that span."),
        h("p", "Clear the pill at the top-left to return to the full range."),
      ]),
    ]),
  ]);
}

/** A clearable pill showing the currently zoomed interval, positioned over the
 * chart's axis header. The tag itself links to the interval page; the clear
 * button resets the zoom, keeping the two interactions distinct. */
function ZoomPill({
  zoom,
  onClear,
}: {
  zoom: { interval: IntervalShort } | null;
  onClear: () => void;
}) {
  if (zoom == null) return null;
  return h(
    "div.zoom-pill",
    h(AgeWindowTag, { interval: zoom.interval, onClear }),
  );
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
