import { BaseUnit } from "@macrostrat/api-types";
import h from "@macrostrat/hyper";
import {
  getQueryString,
  setQueryString,
  useKeyHandler,
} from "@macrostrat/ui-components";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";

type UnitSelectDispatch = (
  unit: BaseUnit | null,
  target: HTMLElement | null,
  event: Event | null
) => void;

const UnitSelectionContext = createContext<BaseUnit | null>(null);
const DispatchContext = createContext<UnitSelectDispatch | null>(null);

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
    (u: T, target: HTMLElement, event: Event) => {
      let newUnit = u;
      setUnit(newUnit);
      onUnitSelected?.(newUnit, target, event);
    },
    [setUnit, onUnitSelected]
  );

  return h(
    DispatchContext.Provider,
    { value: _onUnitSelected },
    h(UnitSelectionContext.Provider, { value }, children)
  );
}

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
  const { col_id, unit_id, project_id, status_code } = search;
  if (col_id == null) return null;
  return { col_id, unit_id, project_id, status_code };
}

export function ColumnNavProvider({ children, ...defaultArgs }) {
  const value = useColumnNav(defaultArgs as any);
  return h(ColumnNavCtx.Provider, { value }, children);
}

export function UnitKeyboardNavigation<T extends BaseUnit>({
  units,
}: {
  units: T[];
}) {
  const selectedUnit = useSelectedUnit();
  const selectUnit = useUnitSelectionDispatch();

  const ix = units.findIndex((unit) => unit.unit_id === selectedUnit?.unit_id);

  const keyMap = {
    38: ix - 1,
    40: ix + 1,
  };

  useKeyHandler(
    (event) => {
      const nextIx = keyMap[event.keyCode];
      if (nextIx == null || nextIx < 0 || nextIx >= units.length) return;
      selectUnit(units[nextIx], null, null);
      event.stopPropagation();
    },
    [units, ix]
  );
  return null;
}
