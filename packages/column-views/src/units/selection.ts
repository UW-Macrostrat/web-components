import { BaseUnit } from "@macrostrat/api-types";
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
  return (evt: Event) => {
    dispatch?.(u);
    evt.stopPropagation();
  };
}

export function useUnitSelectionDispatch() {
  return useContext(DispatchContext);
}

export function useSelectedUnit() {
  return useContext(UnitSelectionContext);
}

interface UnitSelectionProps<T extends BaseUnit> {
  children: React.ReactNode;
  unit: T | null;
  setUnit: Dispatch<SetStateAction<T>>;
}

export function UnitSelectionProvider<T extends BaseUnit>(
  props: Partial<UnitSelectionProps<T>>
) {
  const { unit, setUnit, children } = props;

  if (unit == null && setUnit == null) {
    return h(StatefulUnitSelectionProvider, props);
  }

  return h(BaseUnitSelectionProvider, { unit, setUnit }, children);
}

function StatefulUnitSelectionProvider<T extends BaseUnit>(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const [unit, setUnit] = useState<T | null>(null);

  return h(BaseUnitSelectionProvider, { children, unit, setUnit });
}

function BaseUnitSelectionProvider<T extends BaseUnit>({
  children,
  unit,
  setUnit,
}: UnitSelectionProps<T>) {
  const value = useMemo(() => unit, [unit?.unit_id]);

  return h(
    DispatchContext.Provider,
    { value: setUnit },
    h(UnitSelectionContext.Provider, { value }, children)
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
