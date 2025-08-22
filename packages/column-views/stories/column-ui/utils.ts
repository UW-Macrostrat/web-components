import { useAPIResult } from "@macrostrat/ui-components";
import { useMemo, useCallback } from "react";
import { BaseUnit } from "@macrostrat/api-types";
import { useArgs } from "storybook/preview-api";

export function useColumnUnits(col_id, inProcess = false): BaseUnit[] | null {
  const status_code = inProcess ? "in process" : undefined;
  const params = useMemo(() => {
    return { col_id, response: "long", status_code, show_position: true };
  }, [col_id, status_code]);
  return useAPIResult(
    "https://macrostrat.org/api/v2/units",
    params,
    (res) => res.success.data,
  );
}

export function useColumnBasicInfo(col_id, inProcess = false) {
  const status_code = inProcess ? "in process" : undefined;
  const params = useMemo(() => {
    return { col_id, status_code };
  }, [col_id, status_code]);
  return useAPIResult(
    "https://macrostrat.org/api/v2/columns",
    params,
    (res) => {
      return res.success?.data[0];
    },
  );
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
