import { useArgs } from "storybook/preview-api";
import { useCallback } from "react";
import { parseLineFromString, stringifyLine } from "../hash-string";

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
