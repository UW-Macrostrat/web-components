import { BaseUnit } from "@macrostrat/api-types";
import h from "@macrostrat/hyper";
import {
  getQueryString,
  setQueryString,
  useKeyHandler,
} from "@macrostrat/ui-components";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { RectBounds } from "./boxes";

type UnitSelectDispatch = (
  unit: BaseUnit | null,
  target: HTMLElement | null,
  event: Event | null
) => void;

const UnitSelectionContext = createContext<StoreApi<UnitSelectionStore>>(null);

export function useUnitSelectionDispatch(): UnitSelectDispatch {
  const store = useContext(UnitSelectionContext);
  if (store == null) {
    return () => {};
  }
  return useStore(store, (state) => state.onUnitSelected);
}

export function useUnitSelectionStore<T>(
  selector: (state: UnitSelectionStore) => T
): T {
  const store = useContext(UnitSelectionContext);
  if (store == null) {
    throw new Error(
      "useUnitSelectionStore must be used within a UnitSelectionProvider"
    );
  }
  return useStore(store, selector);
}

export function useSelectedUnit() {
  return useUnitSelectionStore((state) => state.unit);
}

export interface UnitSelectionProps<T extends BaseUnit> {
  children: React.ReactNode;
  unit: T | null;
  onUnitSelected?: (unit: T, target: HTMLElement, event: Event) => void;
}

interface UnitSelectionStore {
  unit: BaseUnit | null;
  overlayPosition: RectBounds | null;
  onUnitSelected: UnitSelectDispatch;
  setSelectedUnit: (unit: null) => void;
}

export function UnitSelectionProvider<T extends BaseUnit>(props: {
  children: ReactNode;
  columnRef?: React.RefObject<HTMLElement>;
  units: T[];
  selectedUnit: number | null;
  onUnitSelected?: (unitID: number | null, unit: T | null) => void;
}) {
  const [store] = useState(() =>
    createStore<UnitSelectionStore>((set) => ({
      unit: null,
      overlayPosition: null,
      setSelectedUnit(unit: number | null) {
        console.log("setSelectedUnit", unit);
        set({ unit });
      },
      onUnitSelected: (unit, target, event) => {
        const el = props.columnRef?.current;
        let overlayPosition = null;
        if (unit != null && el != null && target != null) {
          const rect = el.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          overlayPosition = {
            x: targetRect.left - rect.left,
            y: targetRect.top - rect.top,
            width: targetRect.width,
            height: targetRect.height,
          };
        }
        props.onUnitSelected?.(unit?.unit_id, unit);

        return set({ unit, overlayPosition });
      },
    }))
  );

  const { units, selectedUnit } = props;

  useEffect(() => {
    const { setSelectedUnit } = store.getState();
    if (selectedUnit != null) {
      const unitData = units.find((u) => u.unit_id === selectedUnit);
      setSelectedUnit(unitData);
    }
  }, [selectedUnit, units]);

  return h(UnitSelectionContext.Provider, { value: store }, props.children);
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
  const { col_id, unit_id, project_id, status_code } = search ?? {};
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
