import { Meta } from "@storybook/react-vite";
import { hyperStyled } from "@macrostrat/hyper";
import { useMemo } from "react";
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
  useAnimatedAgeWindow,
  type AgeWindow,
} from "../../src";
import { CorrelationColumnHeader } from "../correlation-chart/utils.ts";
import styles from "../correlation-chart/stories.module.sass";

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

  const units = useMemo(
    () => columnUnits?.flatMap((d) => d.units) ?? [],
    [columnUnits],
  );

  // The full data extent — the window we reset to and animate away from.
  const fullExtent = useMemo<AgeWindow | null>(() => {
    if (units.length === 0) return null;
    return {
      t_age: Math.min(...units.map((u) => u.t_age)),
      b_age: Math.max(...units.map((u) => u.b_age)),
    };
  }, [units]);

  const zoom = useAnimatedAgeWindow({ fullExtent });

  const onClickTimescaleInterval = (_event, data) => {
    if (data?.interval == null) return;
    // Pan-and-contract to the clicked interval (density unchanged).
    zoom.zoomToInterval(data.interval);
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
            // Animated age window drives the standard clipping props.
            t_age: zoom.window?.t_age,
            b_age: zoom.window?.b_age,
            // Reveal 24 px of the abutting sections past the window, resolved
            // against their real laid-out heights.
            windowPadding: 24,
            // Skip per-frame label/pattern work while the window animates.
            isTransitioning: zoom.isAnimating,
            axisTopContent: h(Button, {
              icon: "zoom-to-fit",
              minimal: true,
              small: true,
              disabled: zoom.isFullExtent,
              intent: Intent.PRIMARY,
              text: "Reset",
              title: "Reset to full extent",
              onClick: () => zoom.reset(),
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
        h(
          "p",
          "Click a timescale interval (left axis) to pan-and-contract the chart to that span.",
        ),
        h(
          "p",
          "Density (px/Myr) is unchanged; use Reset to ease back to the full column.",
        ),
      ]),
    ]),
  ]);
}

export default {
  title: "Column views/Column animations/Correlation chart",
  component: AnimatedZoomStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Animated age-window navigation (feature area: *Age scale " +
          "transition animations*). Clicking a timescale interval animates the " +
          "rendered `t_age`/`b_age` — a **pan-and-contract** at constant " +
          "`pixelScale`: units past the bounds get a zig-zag edge, " +
          "unconformities keep their fixed pixel height, and the column simply " +
          "narrows. Changing `pixelScale` (density) is the separate, " +
          "user-controlled zoom axis.",
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
    hideLabelsWhileTransitioning: false,
  },
  argTypes: {
    minPixelScale: { control: { type: "number" } },
    minSectionHeight: { control: { type: "number" } },
    targetUnitHeight: { control: { type: "number" } },
    hideLabelsWhileTransitioning: { control: { type: "boolean" } },
  },
} as Meta<typeof AnimatedZoomStoryUI>;

export const AnimatedTimescaleZoom = {};

/** Same animation, but with an explicit `pixelScale` (px/Myr) pinned so density
 * is strictly constant throughout the pan-and-contract — the column height is
 * exactly proportional to the visible age span. Contrast with the default,
 * where per-section density is derived from unit heights and drifts slightly as
 * the window narrows. */
export const FixedPixelScale = {
  args: {
    pixelScale: 3,
  },
};
