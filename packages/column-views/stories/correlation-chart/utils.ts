import { useArgs } from "storybook/preview-api";
import { useCallback } from "react";
import type { ColumnHeaderProps } from "../../src";
import { Identifier, parseLineFromString, stringifyLine } from "../../src";
import h from "./stories.module.sass";
import { fetchUnits, useMacrostratFetch } from "@macrostrat/data-provider";
import { useAsyncMemo } from "@macrostrat/ui-components";
import { useCorrelationMapStore } from "@macrostrat/map-views";

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

/** Standard header content placed above each column: the column name (provided
 * by the chart) and its ID, with an optional remove button when the chart
 * enables removal. This is a pure component — column-level hover/click and name
 * resolution are handled by the chart, so no hooks are needed here. */
export function CorrelationColumnHeader({
  columnID,
  columnName,
}: ColumnHeaderProps) {
  return h("div.column-header", [
    h("span.column-name", columnName ?? `Column ${columnID}`),
    " ",
    h(Identifier, { id: columnID, className: "column-id" }),
  ]);
}

export function useCorrelationChartUnits() {
  const fetch = useMacrostratFetch();

  // Sync focused columns with map
  const focusedColumns = useCorrelationMapStore(
    (state) => state.focusedColumns,
  );

  const colIDs = focusedColumns.map((col) => col.properties.col_id);

  return useAsyncMemo(async () => {
    const col_ids = focusedColumns.map((col) => col.properties.col_id);
    return await fetchUnits(col_ids, fetch);
  }, [colIDs.join(",")]);
}
