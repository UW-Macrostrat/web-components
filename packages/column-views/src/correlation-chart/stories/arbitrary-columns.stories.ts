import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { hyperStyled } from "@macrostrat/hyper";
import { useCallback, useMemo } from "react";
import { useArgs } from "storybook/preview-api";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
  useMacrostratColumns,
} from "@macrostrat/data-provider";
import {
  useMapStyleOperator,
  useOverlayStyle,
} from "@macrostrat/mapbox-react";
import { setGeoJSON, buildGeoJSONSource } from "@macrostrat/mapbox-utils";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { MacrostratInteractionProvider } from "@macrostrat/data-components";
import type { FeatureCollection } from "geojson";
import type { Style } from "mapbox-gl";

import { InsetMap, BaseColumnsLayer } from "../..";
import { CorrelationChart } from "../main";
import { CorrelationColumnHeader } from "./utils";
import styles from "./stories.module.sass";

// Interactive selection of arbitrary (non-adjacent) columns, no line-of-section.
const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

/** Parse the comma-separated column ID list from the Storybook control */
function parseColumnIDs(value: string | null | undefined): number[] {
  if (value == null) return [];
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
}

function ArbitraryColumnsStoryUI({
  projectID,
  selectedColumnIDs,
  toggleColumn,
  ...rest
}: any) {
  const domain = "https://dev.macrostrat.org";
  return h(
    MacrostratDataProvider,
    { baseURL: domain + "/api/v2" },
    h(
      MacrostratInteractionProvider,
      { linkDomain: domain },
      h(ArbitraryColumnsLayout, {
        projectID,
        selectedColumnIDs,
        toggleColumn,
        ...rest,
      }),
    ),
  );
}

function ArbitraryColumnsLayout({
  projectID,
  selectedColumnIDs = [],
  toggleColumn,
  ...props
}: any) {
  /** Select an arbitrary set of (possibly non-adjacent) columns directly, with
   * no line-of-section. Clicking a column on the map toggles it in or out of
   * the selection. */
  const fetch = useMacrostratFetch();
  const idsKey = selectedColumnIDs.join(",");

  const columnUnits = useAsyncMemo(async () => {
    if (selectedColumnIDs.length === 0) return [];
    return await fetchUnits(selectedColumnIDs, fetch);
  }, [idsKey]);

  return h("div.correlation-ui", [
    h(
      "div.correlation-container",
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            columnHeaderComponent: CorrelationColumnHeader,
            ...props,
          }),
        ]),
      ),
    ),
    h("div.right-column.docked", [
      h(
        "div.map-panel",
        h(ColumnPickerMap, {
          projectID,
          selectedColumnIDs,
          onToggleColumn: toggleColumn,
        }),
      ),
      h("div.picker-help", [
        h("p", "Click columns on the map to add or remove them."),
        h("p.column-list", [
          "Selected: ",
          selectedColumnIDs.length > 0
            ? h("code", selectedColumnIDs.join(", "))
            : h("em", "none"),
        ]),
      ]),
    ]),
  ]);
}

const columnLayers = ["columns-fill", "columns-points"];

function ColumnPickerMap({ projectID, selectedColumnIDs, onToggleColumn }: any) {
  const columns = useMacrostratColumns(projectID, false);

  return h(
    InsetMap,
    {
      accessToken: mapboxToken,
      className: "correlation-map",
      boxZoom: false,
      dragRotate: false,
    },
    [
      h(BaseColumnsLayer, { columns }),
      h(ColumnClickHandler, { onToggleColumn }),
      h(SelectedColumnsOverlay, { columns, selectedColumnIDs }),
    ],
  );
}

function ColumnClickHandler({ onToggleColumn }) {
  useMapStyleOperator(
    (map) => {
      const onClick = (event) => {
        const feature = event.features?.[0];
        const colID = feature?.properties?.col_id;
        if (colID != null) {
          onToggleColumn(colID);
        }
      };
      const onEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        map.getCanvas().style.cursor = "";
      };
      map.on("click", columnLayers, onClick);
      map.on("mouseenter", columnLayers, onEnter);
      map.on("mouseleave", columnLayers, onLeave);
      return () => {
        map.off("click", columnLayers, onClick);
        map.off("mouseenter", columnLayers, onEnter);
        map.off("mouseleave", columnLayers, onLeave);
      };
    },
    [onToggleColumn],
  );
  return null;
}

function SelectedColumnsOverlay({ columns, selectedColumnIDs }) {
  useOverlayStyle(() => selectedColumnsStyle, []);

  const selectedFeatures = useMemo(() => {
    const set = new Set(selectedColumnIDs);
    return (columns ?? []).filter((col) => set.has(col.properties?.col_id));
  }, [columns, selectedColumnIDs]);

  useMapStyleOperator(
    (map) => {
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: selectedFeatures,
      };
      setGeoJSON(map, "selected-columns", data);
    },
    [selectedFeatures],
  );
  return null;
}

const selectedColumnsStyle: Style = {
  version: 8,
  sources: {
    "selected-columns": buildGeoJSONSource(),
  },
  layers: [
    {
      id: "selected-columns-fill",
      type: "fill",
      source: "selected-columns",
      paint: {
        "fill-color": "#7f5bd6",
        "fill-opacity": 0.4,
      },
    },
    {
      id: "selected-columns-line",
      type: "line",
      source: "selected-columns",
      paint: {
        "line-color": "#7f5bd6",
        "line-width": 2,
      },
    },
    {
      id: "selected-columns-points",
      type: "circle",
      source: "selected-columns",
      paint: {
        "circle-radius": 6,
        "circle-color": "#7f5bd6",
      },
      filter: ["==", "$type", "Point"],
    },
  ],
};

export default {
  title: "Column views/Correlation chart",
  component: ArbitraryColumnsStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Build a correlation chart from an arbitrary set of columns, selected " +
          "directly rather than via a line-of-section. The selected columns may " +
          "be non-adjacent and in any order.",
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  args: {
    // A couple of far-apart, non-adjacent columns to start with
    columnIDs: "432, 490",
    columnSpacing: 20,
    columnWidth: 100,
    collapseSmallUnconformities: true,
    targetUnitHeight: 20,
  },
  argTypes: {
    columnIDs: {
      control: { type: "text" },
      description: "Comma-separated list of column IDs to correlate",
    },
    projectID: { control: { type: "number" } },
  },
} as Meta<typeof ArbitraryColumnsStoryUI>;

function Template(args) {
  // `useArgs` is a Storybook preview hook and must be called in the story
  // render function, not deep in the component tree.
  const [{ columnIDs }, updateArgs] = useArgs();
  const selectedColumnIDs = useMemo(
    () => parseColumnIDs(columnIDs),
    [columnIDs],
  );
  const toggleColumn = useCallback(
    (colID: number) => {
      const current = parseColumnIDs(columnIDs);
      const next = current.includes(colID)
        ? current.filter((d) => d !== colID)
        : [...current, colID];
      updateArgs({ columnIDs: next.join(", ") });
    },
    [columnIDs, updateArgs],
  );

  return h(ArbitraryColumnsStoryUI, { ...args, selectedColumnIDs, toggleColumn });
}

export const ArbitraryColumnSelection = Template.bind({});
