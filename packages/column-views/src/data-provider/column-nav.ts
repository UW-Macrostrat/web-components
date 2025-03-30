import h from "@macrostrat/hyper";
import { getQueryString, setQueryString } from "@macrostrat/ui-components";
import { createContext, useContext, useEffect, useState } from "react";

export interface ColumnArgs {
  col_id?: number;
  unit_id?: number;
  project_id?: number;
  status_code?: "in process";
}

type ColumnManagerData = [ColumnArgs, (c: ColumnArgs) => void];

const ColumnNavCtx = createContext<ColumnManagerData | null>(null);

export function useColumnNav(
  defaultArgs: ColumnArgs = { col_id: 495, unit_id: null }
): ColumnManagerData {
  const ctx = useContext(ColumnNavCtx);
  if (ctx != null) return ctx;

  const [columnArgs, setColumnArgs] = useState<ColumnArgs>(
    extractColumnArgs(getQueryString(window.location.search)) ?? defaultArgs
  );

  useEffect(() => setQueryString(columnArgs), [columnArgs]);

  const { col_id, project_id, status_code } = columnArgs;

  const setCurrentColumn = (obj) => {
    let args = obj;
    if ("properties" in obj) {
      args = { col_id: obj.properties.col_id, project_id, status_code };
    }
    // Set query string
    setQueryString(args);
    setColumnArgs(args);
  };

  return [columnArgs, setCurrentColumn];
}

function extractColumnArgs(search: any): ColumnArgs | null {
  const { col_id, unit_id, project_id, status_code } = search ?? {};
  if (col_id == null) return null;
  return { col_id, unit_id, project_id, status_code };
}

export function ColumnNavProvider({ children, ...defaultArgs }) {
  /** Column navigation provider that manages the query string for selected columns */
  const value = useColumnNav(defaultArgs as any);
  return h(ColumnNavCtx.Provider, { value }, children);
}
