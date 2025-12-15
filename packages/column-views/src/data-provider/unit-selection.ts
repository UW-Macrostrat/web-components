import { BaseUnit } from "@macrostrat/api-types";
import { useKeyHandler } from "@macrostrat/ui-components";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createStore, StoreApi, useStore } from "zustand";
import type { RectBounds, IUnit } from "../units/types";
import { atom, Getter, Setter } from "jotai";
import { columnUnitsMapAtom } from "./core";
import styles from "../column.module.sass";
import { scope } from "./core";

type UnitSelectDispatch = (
  unit: number | BaseUnit | null,
  target: HTMLElement | null,
  event: Event | null,
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
  selector: (state: UnitSelectionStore) => T,
): T {
  const store = useContext(UnitSelectionContext);
  if (store == null) {
    return null;
  }
  return useStore(store, selector);
}

export function useSelectedUnit() {
  return scope.useAtomValue(selectedUnitAtom);
}

interface UnitSelectionStore {
  selectedUnit: number | null;
  selectedUnitData: BaseUnit | null;
  overlayPosition: RectBounds | null;
  onUnitSelected: UnitSelectDispatch;
  setSelectedUnit: (unit: number | null) => void;
}

export interface ColumnClickData {
  unitID: number | null;
  unit: BaseUnit | null;
  target: HTMLElement | null;
  height: number;
  // Room for boundary IDs eventually
}

export interface UnitSelectionCallbacks {
  // It's sort of unfortunate that we need to pass in the column ref here
  onClickedColumn?: (columnClickData: ColumnClickData, event: Event) => void;
  onUnitSelected?: <T extends BaseUnit>(
    unitID: number | null,
    unit: T | null,
  ) => void;
}

export const allowUnitSelectionAtom = atom<boolean>(true);

export const selectedUnitIDAtom = atom<number | null>();

const overlayPositionAtom = atom<RectBounds | null>();

const selectedUnitAtom = atom(
  (get) => {
    if (!get(allowUnitSelectionAtom)) return null;

    const unitID = get(selectedUnitIDAtom);
    if (unitID == null) return null;
    const unitsMap = get(columnUnitsMapAtom);
    return unitsMap?.get(unitID) || null;
  },
  (
    get,
    set,
    selectedUnit: number | BaseUnit | null,
    target: HTMLElement | null = null,
  ): BaseUnit | null => {
    if (!get(allowUnitSelectionAtom)) {
      throw new Error("Unit selection is disabled.");
    }

    let unitID: number | null = null;
    if (typeof selectedUnit === "number") {
      unitID = selectedUnit;
    } else if ("unit_id" in selectedUnit) {
      unitID = selectedUnit.unit_id;
    }
    let unit: BaseUnit | null = null;
    if (unitID != null) {
      // Verify that the unit exists in the current colum, else throw
      const unitsMap = get(columnUnitsMapAtom);
      if (!unitsMap?.has(unitID)) {
        throw new Error(
          `Unit with ID ${unitID} not found in current column units.`,
        );
      }
      unit = unitsMap.get(unitID) || null;
    } else {
      // clear target position as well
      set(overlayPositionAtom, null);
    }

    set(selectedUnitIDAtom, unitID);

    let overlayPosition: RectBounds | null = null;

    // Calculate overlay position if we've selected a new unit
    const className = styles["column"];
    const columnEl = target?.closest(`.${className}`) as HTMLElement;

    if (unit != null && columnEl != null && target != null) {
      const rect = columnEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      overlayPosition = {
        x: targetRect.left - rect.left,
        y: targetRect.top - rect.top,
        width: targetRect.width,
        height: targetRect.height,
      };
    }

    set(overlayPositionAtom, overlayPosition);

    return unit;
  },
);

export function UnitSelectionHandlers({
  onUnitSelected,
}: UnitSelectionCallbacks) {
  const selectedUnit = scope.useAtomValue(selectedUnitAtom);
  useEffect(() => {
    onUnitSelected?.(selectedUnit?.unit_id ?? null, selectedUnit ?? null);
  }, [selectedUnit, onUnitSelected]);
  return null;
}

/** TODO: figure out if onClickedColumn is still needed
 /** This is not the natural place to get positions within the column,
 * but it will work for now.
if (props.onClickedColumn) {
  // Infer height from top and bottom height of unit (because that's passed back with the call)
  //const py = event.y;
  //const [bottom, top] = getUnitHeightRange(unit, axisType);
  //const height = Math.abs(bottom - top);

  const columnClickData: ColumnClickData = {
    unitID: unit?.unit_id,
    unit,
    target,
    height: el?.getBoundingClientRect().height || 0,
  };
  props.onClickedColumn(columnClickData, event);
}*/

export function useUnitSelectionTarget(
  unit: IUnit,
): [React.RefObject<HTMLElement>, boolean, (evt: Event) => void] {
  const ref = useRef<HTMLElement>();
  const selectedUnit = useSelectedUnit();
  const onSelectUnit = useUnitSelectionStore((state) => state.onUnitSelected);
  const selected = selectedUnit?.unit_id == unit.unit_id;

  const onClick = useCallback(
    (evt: Event) => {
      if (onSelectUnit == null) return;
      onSelectUnit(unit, ref.current, evt);
      evt.stopPropagation();
    },
    [unit, onSelectUnit],
  );

  useEffect(() => {
    if (!selected || onSelectUnit == null) return;
    // In case we haven't set the position of the unit (if we don't have a target), set the selected unit
    onSelectUnit(unit, ref.current, null);

    // Scroll the unit into view
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [selected, onSelectUnit]);

  return [ref, selected, onClick];
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
    [units, ix],
  );
  return null;
}
