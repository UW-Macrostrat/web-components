import { BaseUnit } from "@macrostrat/api-types";
import h from "@macrostrat/hyper";
import { useKeyHandler } from "@macrostrat/ui-components";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  RefObject,
  useRef,
  useCallback,
} from "react";
import { createStore, StoreApi, useStore } from "zustand";
import type { RectBounds, IUnit } from "./types";

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
  return useUnitSelectionStore((state) => state.selectedUnitData);
}

interface UnitSelectionStore {
  selectedUnit: number | null;
  selectedUnitData: BaseUnit | null;
  overlayPosition: RectBounds | null;
  onUnitSelected: UnitSelectDispatch;
  setSelectedUnit: (unit: number | null) => void;
}

export function UnitSelectionProvider<T extends BaseUnit>(props: {
  children: ReactNode;
  columnRef?: RefObject<HTMLElement>;
  units: T[];
  selectedUnit: number | null;
  onUnitSelected?: (unitID: number | null, unit: T | null) => void;
}) {
  const [store] = useState(() =>
    createStore<UnitSelectionStore>((set) => ({
      selectedUnit: null,
      selectedUnitData: null,
      overlayPosition: null,
      setSelectedUnit(selectedUnit: number | null | BaseUnit) {
        if (selectedUnit == null) {
          set({ selectedUnit: null, selectedUnitData: null });
          return;
          // If it's a number, set the selected unit
        } else if (typeof selectedUnit === "number") {
          set({ selectedUnit, selectedUnitData: null });
        } else if ("unit_id" in selectedUnit) {
          set({
            selectedUnit: selectedUnit.unit_id,
            selectedUnitData: selectedUnit,
          });
        }
      },
      onUnitSelected: (unit: T, target: HTMLElement, event: Event) => {
        console.log("onUnitSelected", unit, target, event);
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

        return set({
          selectedUnit: unit?.unit_id,
          selectedUnitData: unit,
          overlayPosition,
        });
      },
    }))
  );

  const { units, selectedUnit } = props;

  useEffect(() => {
    if (selectedUnit != null) {
      const unitData = units?.find((u) => u.unit_id === selectedUnit);
      store.setState({ selectedUnitData: unitData });
    }
  }, [selectedUnit, units]);

  return h(UnitSelectionContext.Provider, { value: store }, props.children);
}

export function useUnitSelectionTarget(
  unit: IUnit
): [React.RefObject<HTMLElement>, boolean, (evt: Event) => void] {
  const ref = useRef<HTMLElement>();
  const selectedUnit = useSelectedUnit();
  const onSelectUnit = useUnitSelectionStore((state) => state.onUnitSelected);
  const selected = selectedUnit?.unit_id == unit.unit_id;

  const onClick = useCallback(
    (evt: Event) => {
      onSelectUnit(unit, ref.current, evt);
      evt.stopPropagation();
    },
    [unit, onSelectUnit]
  );

  useEffect(() => {
    if (!selected) return;
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
    [units, ix]
  );
  return null;
}
