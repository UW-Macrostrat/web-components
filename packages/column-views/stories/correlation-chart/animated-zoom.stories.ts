import { Meta } from "@storybook/react-vite";
import { hyperStyled } from "@macrostrat/hyper";
import { useMemo, useRef, useState } from "react";
import { zoomIdentity, ZoomTransform } from "d3-zoom";
import { Button, Intent, OverlaysProvider } from "@blueprintjs/core";
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
  useColumnMapLink,
  buildCorrelationChartData,
  defaultCorrelationChartScaleProps,
  useAgeScaleZoom,
} from "../../src";
import { CorrelationColumnHeader } from "./utils.ts";
import styles from "./stories.module.sass";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

function AnimatedZoomStoryUI({ focusedLine, projectID, ...rest }: any) {
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
        h(AnimatedZoomLayout, rest),
      ),
    ),
  );
}

function AnimatedZoomLayout(props) {
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

  // The chart's committed (identity) layout — used to derive base pixel
  // positions for the zoom driver. Built with the same settings the chart uses
  // internally so the pixels match exactly.
  const chartData = useMemo(() => {
    if (columnUnits == null || columnUnits.length === 0) return null;
    return buildCorrelationChartData(columnUnits, {
      ...defaultCorrelationChartScaleProps,
      ...props,
    });
  }, [columnUnits, ...Object.values(props)]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const zoom = useAgeScaleZoom({
    baseScaleInfo: chartData?.scaleInfo ?? null,
    transform,
    onTransformChange: setTransform,
    scrollContainerRef: scrollRef,
  });

  const onClickTimescaleInterval = (_event, data) => {
    if (data?.interval == null) return;
    zoom.zoomToInterval(data.interval);
  };

  const isFullExtent = transform.k === 1 && transform.y === 0;

  return h("div.side-panel-ui", [
    h(
      "div.chart-scroll",
      { ref: scrollRef },
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            columnHeaderComponent: CorrelationColumnHeader,
            transform,
            axisTopContent: h(Button, {
              icon: "zoom-to-fit",
              minimal: true,
              small: true,
              disabled: isFullExtent,
              intent: Intent.PRIMARY,
              title: "Reset zoom",
              onClick: () => zoom.reset(),
              text: "Reset",
            }),
            onClickTimescaleInterval,
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
        h("p", "Click a timescale interval (left axis) to animate a zoom to that span."),
        h("p", "Use Reset (top-left) to ease back to the full column."),
      ]),
    ]),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: AnimatedZoomStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Animated age-scale zoom (feature area: *Age scale transition " +
          "animations*, Scope B). Clicking a timescale interval eases a " +
          "`d3`-transform-driven zoom of the whole correlation chart (columns " +
          "+ axis + timescale) via `useAgeScaleZoom` — pan-model A, which " +
          "animates zoom density and the scroll position while keeping the " +
          "existing scroll layout. Identity transform is the committed layout.",
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
    minPixelScale: 1,
    minSectionHeight: 60,
  },
  argTypes: {
    minPixelScale: { control: { type: "number" } },
    minSectionHeight: { control: { type: "number" } },
    targetUnitHeight: { control: { type: "number" } },
  },
} as Meta<typeof AnimatedZoomStoryUI>;

export const AnimatedTimescaleZoom = {};
