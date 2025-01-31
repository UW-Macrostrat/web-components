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
  ReactNode,
  RefObject,
  useCallback,
} from "react";
import { IUnit } from "@macrostrat/column-views";

type UnitSelectDispatch = (
  unit: BaseUnit | null,
  target: HTMLElement,
  event: Event
) => void;

const UnitSelectionContext = createContext<BaseUnit | null>(null);
const DispatchContext = createContext<UnitSelectDispatch | null>(null);

export function useUnitSelector(u: BaseUnit | null) {
  const dispatch = useContext(DispatchContext);
  return (target: HTMLElement, evt: Event) => {
    console.log("Dispatch", u, target, evt);
    dispatch?.(u, target, evt);
    evt.stopPropagation();
  };
}

export function useSelectedUnit() {
  return useContext(UnitSelectionContext);
}

interface UnitSelectionProps<T extends BaseUnit> {
  children: React.ReactNode;
  unit: T | null;
  setUnit: Dispatch<SetStateAction<T>>;
  onUnitSelected?: (unit: T, target: HTMLElement, event: Event) => void;
}

export function UnitSelectionProvider<T extends BaseUnit>(
  props: Partial<UnitSelectionProps<T>>
) {
  const { unit, setUnit, onUnitSelected, children } = props;

  if (unit == null && setUnit == null) {
    return h(StatefulUnitSelectionProvider, props);
  }

  return h(
    BaseUnitSelectionProvider,
    { unit, setUnit, onUnitSelected },
    children
  );
}

function StatefulUnitSelectionProvider<T extends BaseUnit>(props: {
  children: ReactNode;
  onUnitSelected?: (unit: T, target: HTMLElement, event: Event) => void;
}) {
  const [unit, setUnit] = useState<T | null>(null);

  return h(BaseUnitSelectionProvider, { ...props, unit, setUnit });
}

function BaseUnitSelectionProvider<T extends BaseUnit>({
  children,
  unit,
  setUnit,
  onUnitSelected,
}: UnitSelectionProps<T>) {
  const value = useMemo(() => unit, [unit?.unit_id]);

  const _onUnitSelected = useCallback(
    (unit: T, target: HTMLElement, event: Event) => {
      setUnit(unit);
      onUnitSelected?.(unit, target, event);
    },
    [setUnit, onUnitSelected]
  );

  return h(
    DispatchContext.Provider,
    { value: _onUnitSelected },
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
