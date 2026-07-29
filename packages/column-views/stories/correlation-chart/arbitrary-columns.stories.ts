import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { hyperStyled } from "@macrostrat/hyper";
import { useState } from "react";
import {
  MacrostratDataProvider,
  fetchUnits,
  useMacrostratFetch,
  useMacrostratColumnInfo,
} from "@macrostrat/data-provider";
import { ErrorBoundary, useAsyncMemo } from "@macrostrat/ui-components";
import { OverlaysProvider } from "@blueprintjs/core";
import { MacrostratInteractionProvider } from "@macrostrat/data-components";

import {
  ColumnCorrelationMap,
  ColumnCorrelationProvider,
  useCorrelationMapStore,
  useColumnMapLink,
  CorrelationChart,
} from "../../src";
import { CorrelationColumnHeader } from "./utils.ts";
import styles from "./stories.module.sass";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

function ArbitraryColumnsStoryUI({ projectID, manualColumns, ...rest }: any) {
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
          // No line of section — columns are chosen directly (manual mode)
          focusedLine: null,
          manualColumns: manualColumns ?? [],
          columns: null,
          projectID,
          onSelectColumns() {},
        },
        h(ArbitraryColumnsLayout, rest),
      ),
    ),
  );
}

function ArbitraryColumnsLayout(props) {
  /** Select an arbitrary set of (possibly non-adjacent) columns directly, with
   * no line-of-section. Click columns on the map to add/remove them, and use
   * the sidebar list to reorder or remove them. */
  const fetch = useMacrostratFetch();

  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );
  const removeColumn = useCorrelationMapStore((state) => state.removeColumn);
  const columnMapLink = useColumnMapLink();
  const colIDs = focusedColumns.map((col) => col.properties.col_id);

  const columnUnits = useAsyncMemo(async () => {
    if (colIDs.length === 0) return [];
    return await fetchUnits(colIDs, fetch);
  }, [colIDs.join(",")]);

  return h("div.side-panel-ui", [
    h(
      "div.chart-scroll",
      h(
        ErrorBoundary,
        h(OverlaysProvider, [
          h(CorrelationChart, {
            data: columnUnits,
            columnHeaderComponent: CorrelationColumnHeader,
            onRemoveColumn: removeColumn,
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
        h("p", "Click columns on the map to add or remove them."),
        h("p", "Drag the list below to reorder; × removes a column."),
      ]),
      h(ColumnReorderList),
    ]),
  ]);
}

/** A sidebar list of the selected columns, in order, supporting drag-and-drop
 * reordering and removal. */
function ColumnReorderList() {
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );
  const setManualColumns = useCorrelationMapStore((s) => s.setManualColumns);
  const removeColumn = useCorrelationMapStore((s) => s.removeColumn);
  const setHoveredColumn = useCorrelationMapStore((s) => s.setHoveredColumn);
  const zoomToColumn = useCorrelationMapStore((s) => s.zoomToColumn);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const ids = focusedColumns.map((c) => c.properties.col_id);

  const move = (from: number | null, to: number) => {
    if (from == null || from === to) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setManualColumns(next);
  };

  if (focusedColumns.length === 0) {
    return h("p.reorder-empty", h("em", "No columns selected"));
  }

  return h(
    "ul.column-reorder-list",
    focusedColumns.map((col, i) => {
      const colID = col.properties.col_id;
      return h(
        "li.reorder-item",
        {
          key: colID,
          draggable: true,
          className: dragIndex === i ? "dragging" : undefined,
          onDragStart: () => setDragIndex(i),
          onDragEnd: () => setDragIndex(null),
          onDragOver: (e: React.DragEvent) => e.preventDefault(),
          onDrop: () => {
            move(dragIndex, i);
            setDragIndex(null);
          },
          onMouseEnter: () => setHoveredColumn(colID),
          onMouseLeave: () => setHoveredColumn(null),
          onClick: () => zoomToColumn(colID),
        },
        [
          h("span.drag-handle", { title: "Drag to reorder" }, "⠿"),
          h(ColumnReorderLabel, { colID }),
          h(
            "button.remove-column",
            {
              title: "Remove column",
              onClick(e) {
                e.stopPropagation();
                removeColumn(colID);
              },
            },
            "×",
          ),
        ],
      );
    }),
  );
}

function ColumnReorderLabel({ colID }: { colID: number }) {
  const info = useMacrostratColumnInfo(colID);
  return h("span.reorder-label", [
    h("span.reorder-name", info?.col_name ?? `Column ${colID}`),
    h("code.reorder-id", colID),
  ]);
}

export default {
  title: "Column views/Correlation chart",
  component: ArbitraryColumnsStoryUI,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Build a correlation chart from an arbitrary set of columns, selected " +
          "directly on the map rather than via a line-of-section. The selected " +
          "columns may be non-adjacent and in any order. The dashed line on the " +
          "map shows the correlation order, and the sidebar list can reorder or " +
          "remove columns.",
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  args: {
    // A couple of far-apart, non-adjacent columns to start with
    manualColumns: [432, 490],
    columnSpacing: 20,
    columnWidth: 100,
    collapseSmallUnconformities: true,
    targetUnitHeight: 20,
  },
  argTypes: {
    projectID: { control: { type: "number" } },
  },
} as Meta<typeof ArbitraryColumnsStoryUI>;

export const ArbitraryColumnSelection = {};
