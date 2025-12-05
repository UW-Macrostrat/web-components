import { useAPIResult } from "@macrostrat/ui-components";
import { useMemo, useCallback } from "react";
import { BaseUnit } from "@macrostrat/api-types";
import { useArgs } from "storybook/preview-api";
import { useMacrostratBaseURL } from "@macrostrat/column-views";

export function useColumnUnits(col_id, inProcess = false): BaseUnit[] | null {
  const status_code = inProcess ? "in process" : undefined;
  const baseURL = useMacrostratBaseURL();
  const params = useMemo(() => {
    return { col_id, response: "long", status_code, show_position: true };
  }, [col_id, status_code]);
  return useAPIResult(baseURL + "/units", params, (res) => res.success.data);
}

export function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  const baseURL = useMacrostratBaseURL();
  const params = useMemo(() => {
    return { col_id, status_code };
  }, [col_id, status_code]);
  return useAPIResult(baseURL + "/columns", params, (res) => {
    return res.success?.data[0];
  });
}

export function useColumnSelection() {
  const [{ columnID, selectedUnit }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs],
  );

  return {
    columnID,
    selectedUnit,
    setColumn,
    setSelectedUnit,
  };
}
