import { useArgs } from "storybook/preview-api";
import { useCallback } from "react";
import { parseLineFromString, stringifyLine } from "../../src";
import { useMacrostratColumnInfo } from "@macrostrat/data-provider";
import { Identifier, useCorrelationMapStore } from "../../src";
import type { ColumnHeaderProps } from "../../src";
import h from "./stories.module.sass";

export function useCorrelationLine() {
  const [{ focusedLine, selectedUnit }, updateArgs] = useArgs();
  const setFocusedLine = (line) => {
    updateArgs({ focusedLine: stringifyLine(line) });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs],
  );

  return {
    focusedLine: parseLineFromString(focusedLine),
    setFocusedLine,
    selectedUnit,
    setSelectedUnit,
  };
}

/** Example header content placed above each column: the column name (looked up
 * from the already-fetched column footprints) and its ID. This demonstrates the
 * `columnHeaderComponent` prop of `CorrelationChart`. */
/** Hover handlers that highlight the corresponding column on the correlation
 * map. Must be used within a `ColumnCorrelationProvider`. */
function useColumnHoverProps(columnID: number) {
  const setHoveredColumn = useCorrelationMapStore((s) => s.setHoveredColumn);
  return {
    onMouseEnter: () => setHoveredColumn(columnID),
    onMouseLeave: () => setHoveredColumn(null),
  };
}

export function CorrelationColumnHeader({ columnID }: ColumnHeaderProps) {
  const info = useMacrostratColumnInfo(columnID);
  const hoverProps = useColumnHoverProps(columnID);
  return h("div.column-header", hoverProps, [
    h("span.column-name", info?.col_name ?? `Column ${columnID}`),
    " ",
    h(Identifier, { id: columnID, className: "column-id" }),
  ]);
}

/** Like `CorrelationColumnHeader`, but with a close button that removes the
 * column from the correlation-map selection. Removing a column from a
 * line-of-section selection switches it to manual (arbitrary) mode. Must be
 * rendered within a `ColumnCorrelationProvider`. */
export function RemovableColumnHeader({ columnID }: ColumnHeaderProps) {
  const info = useMacrostratColumnInfo(columnID);
  const removeColumn = useCorrelationMapStore((s) => s.removeColumn);
  const hoverProps = useColumnHoverProps(columnID);
  return h("div.column-header.removable", hoverProps, [
    h(
      "button.remove-column",
      {
        title: "Remove column",
        onClick(e) {
          e.stopPropagation();
          removeColumn(columnID);
        },
      },
      "×",
    ),
    h("span.column-name", info?.col_name ?? `Column ${columnID}`),
    h(Identifier, { id: columnID, className: "column-id" }),
  ]);
}
