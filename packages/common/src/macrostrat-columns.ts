import { useState, useEffect, useContext, createContext } from "react";
import { getQueryString, setQueryString } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

interface ColumnArgs {
  col_id?: number;
  project?: number;
  status?: "in process";
}

type ColumnManagerData = [ColumnArgs, (c: ColumnArgs) => void];

const ColumnNavCtx = createContext<ColumnManagerData | null>(null);

function useColumnNav(defaultArgs = { col_id: 495 }): ColumnManagerData {
  const ctx = useContext(ColumnNavCtx);
  if (ctx != null) return ctx;
  const initArgs: ColumnArgs = getQueryString() ?? defaultArgs;
  const [columnArgs, setColumnArgs] = useState<ColumnArgs>(initArgs);

  useEffect(() => setQueryString(columnArgs));

  const { col_id, ...projectParams } = columnArgs;

  const setCurrentColumn = obj => {
    let args = obj;
    if ("properties" in obj) {
      args = { col_id: obj.properties.col_id, ...projectParams };
    }
    // Set query string
    setQueryString(args);
    setColumnArgs(args);
  };

  return [columnArgs, setCurrentColumn];
}

function ColumnNavProvider({ children, ...defaultArgs }) {
  const value = useColumnNav(defaultArgs);
  return h(ColumnNavCtx.Provider, { value }, children);
}

export { useColumnNav, ColumnNavProvider };
