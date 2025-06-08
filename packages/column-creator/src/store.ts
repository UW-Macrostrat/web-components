import { useContext, createContext, useState } from "react";
import { create, StoreApi, useStore } from "zustand";
import h from "@macrostrat/hyper";
import { sort } from "d3-array";

interface ColumnCreatorState {
  units: any[]; // Replace 'any' with a more specific type if available
  updatedUnits?: any[]; // Optional, replace 'any' with a more specific type if available
  extUnits?: any[]; // Optional, replace 'any' with a more specific type if available
  sections: any[]; // Replace 'any' with a more specific type if available
  range: [number, number];
  axisType?: string; // Replace 'string' with a more specific type if available
}

interface ColumnCreatorActions {
  setUnits: (units: any[]) => void; // Replace 'any' with a more specific type if available
}

type ColumnCreatorStore = ColumnCreatorState & ColumnCreatorActions;

function createColumnStore(initialState: ColumnCreatorState) {
  return create<ColumnCreatorStore>()((set) => {
    return {
      ...initialState,
      updatedUnits: initialState.units,
      extUnits: extendUnits(sortUnits(initialState.units)),
      setUnits: (units) => {
        // Sort units by their bottom position
        const sortedUnits = sortUnits(units);
        const extUnits = extendUnits(sortedUnits);
        console.log("Extended units:", extUnits);
        set((state) => ({
          ...state,
          updatedUnits: sortedUnits,
          extUnits,
        }));
      },
    };
  });
}

function sortUnits(units: any[]): any[] {
  // This function should synthesize or transform the units as needed.
  // For now, it just returns the input units sorted by their b_pos.
  const u1 = units.filter((unit) => unit?.b_pos != null && unit?.b_pos !== "");
  // Make positions into numbers
  u1.forEach((unit) => {
    if (typeof unit.b_pos === "string") {
      unit.b_pos = parseFloat(unit.b_pos);
    }
    if (typeof unit.t_pos === "string") {
      unit.t_pos = parseFloat(unit.t_pos);
    }
  });

  // turn float nans into nulls
  u1.forEach((unit) => {
    if (isNaN(unit.b_pos)) unit.b_pos = null;
    if (isNaN(unit.t_pos)) unit.t_pos = null;
  });

  u1.sort((a, b) => a.b_pos - b.b_pos);

  console.log("Sorted units:", u1);
  return u1;
}

function extendUnits(units: any[]): any[] {
  // This function should synthesize or transform the units as needed.
  // For now, it just returns the input units sorted by their b_pos.
  const u1 = [...units];
  // Ensure that t_pos is set if not defined

  u1.forEach((unit, i) => {
    if (unit.t_pos == null || unit.t_pos == "") {
      // Get the next unit's b_pos or use a default value
      const nextUnit = u1[i + 1];
      if (nextUnit != null) {
        unit.t_pos = nextUnit.b_pos;
      }
    }

    unit.unit_name ??= "Unnamed";
  });

  return u1;
}

const ColumnCreatorStoreContext =
  createContext<StoreApi<ColumnCreatorStore> | null>(null);

const defaultState: ColumnCreatorState = {
  units: [],
  sections: [],
  range: [0, 100],
  axisType: "height", // Default value, can be changed
};

export function ColumnCreatorProvider({
  children,
  initialState = {},
}: {
  children: React.ReactNode;
  initialState?: Partial<ColumnCreatorState>;
}) {
  const [store, _] = useState(() =>
    createColumnStore({ ...defaultState, ...initialState })
  );

  return h(ColumnCreatorStoreContext.Provider, { value: store }, children);
}

export function useColumnCreatorStore(): StoreApi<ColumnCreatorStore> {
  const store = useContext(ColumnCreatorStoreContext);
  if (!store) {
    throw new Error(
      "useColumnCreatorStore must be used within a ColumnCreatorProvider"
    );
  }
  return store;
}

export function useSelector<T extends keyof ColumnCreatorStore>(
  selector: (state: ColumnCreatorStore) => ColumnCreatorStore[T]
): ColumnCreatorStore[T] {
  const store = useColumnCreatorStore();
  return useStore(store, selector);
}
