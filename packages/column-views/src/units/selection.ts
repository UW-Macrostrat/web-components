import { BaseUnit } from "/Users/Daven/Projects/Macrostrat/Software/web/deps/web-components/packages/api-types/src";
import h from "@macrostrat/hyper";
import { getQueryString, setQueryString } from "@macrostrat/ui-components";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type UnitSelectDispatch = Dispatch<SetStateAction<BaseUnit | null>>;

const UnitSelectionContext = createContext<BaseUnit | null>(null);
const DispatchContext = createContext<UnitSelectDispatch | null>(null);

export function useUnitSelector(u: BaseUnit | null) {
  const dispatch = useContext(DispatchContext);
  return () => {
    dispatch?.(u);
  };
}

export function useUnitSelectionDispatch() {
  return useContext(DispatchContext);
}

export function useSelectedUnit() {
  return useContext(UnitSelectionContext);
}

export function UnitSelectionProvider<BaseUnit>(props: {
  children: React.ReactNode;
}) {
  const [unit, setUnit] = useState<BaseUnit | null>(null);
  const value = useMemo(() => unit, [unit?.unit_id]);

  return h(
    DispatchContext.Provider,
    { value: setUnit },
    h(UnitSelectionContext.Provider, { value }, props.children)
  );
}

interface ColumnArgs {
  col_id?: number;
  unit_id?: number;
  project?: number;
  status?: "in process";
}

type ColumnManagerData = [ColumnArgs, (c: ColumnArgs) => void];

const ColumnNavCtx = createContext<ColumnManagerData | null>(null);

export function useColumnNav(
  defaultArgs = { col_id: 495, unit_id: null }
): ColumnManagerData {
  const ctx = useContext(ColumnNavCtx);
  if (ctx != null) return ctx;

  const [columnArgs, setColumnArgs] = useState<ColumnArgs>(
    getQueryString(window.location.search) ?? defaultArgs
  );

  useEffect(() => setQueryString(columnArgs), [columnArgs]);

  const { col_id, ...projectParams } = columnArgs;

  const setCurrentColumn = (obj) => {
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

export { ColumnNavProvider };
