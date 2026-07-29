import { useArgs } from "storybook/preview-api";
import { useCallback } from "react";
import { parseLineFromString, stringifyLine } from "../hash-string";
import { useMacrostratColumnInfo } from "@macrostrat/data-provider";
import hyper from "@macrostrat/hyper";
import { Identifier } from "../..";
import type { ColumnHeaderProps } from "../main";
import styles from "./stories.module.sass";

const h = hyper.styled(styles);

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
export function CorrelationColumnHeader({ columnID }: ColumnHeaderProps) {
  const info = useMacrostratColumnInfo(columnID);
  return h("div.column-header", [
    h("span.column-name", info?.col_name ?? `Column ${columnID}`),
    h(Identifier, { id: columnID, className: "column-id" }),
  ]);
}
