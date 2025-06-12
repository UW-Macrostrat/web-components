import { useContext, createContext, useState } from "react";
import { create, StoreApi, useStore } from "zustand";
import h from "@macrostrat/hyper";
import { ColumnAxisType } from "@macrostrat/column-components";
import { Spec } from "immutability-helper";
import update from "immutability-helper";
import { createComputed } from "zustand-computed";

interface ColumnBasicInfo {
  name: string;
  range: [number, number];
  axisType?: ColumnAxisType; // Optional, replace 'string' with a more specific type if available
}

interface ColumnUnit {
  b_surface: string;
  t_surface: string;
  name: string;
  color: string;
  pattern: string;
}

interface ColumnSurface {
  id: string;
  height: number;
  age: number;
  interval: string;
  proportion: number;
  // macrostratInterval: string;
  // hasAge: boolean;
  // hasHeight: boolean;
  // ageIsAbsolute: boolean;
}

export interface ColumnCreatorData {
  units: ColumnUnit[]; // Replace 'any' with a more specific type if available
  surfaces: ColumnSurface[]; // A surface in time or height
}

interface ColumnCreatorState {
  initialData?: ColumnCreatorData; // Optional initial data
  data: ColumnCreatorData; // Optional data, can be used to initialize the store
  info: ColumnBasicInfo; // Basic information about the column
}

interface ColumnCreatorActions {
  setUnits: (units: any[]) => void; // Replace 'any' with a more specific type if available
  setSurfaces: (surfaces: ColumnSurface[]) => void;
  updateState(spec: Spec<ColumnCreatorState>): void;
  updateInfo(spec: Spec<ColumnBasicInfo>): void;
}

type ColumnCreatorStore = ColumnCreatorState & ColumnCreatorActions;

type ComputedStore = {};

const computed = createComputed((store: ColumnCreatorStore): ComputedStore => {
  return {
    realizedUnits: computeRealizedUnits(store.data),
  };
}) as any;

type SetFn = (
  fn: (state: ColumnCreatorStore) => Partial<ColumnCreatorStore>
) => void;

function createColumnStore(initialState: Partial<ColumnCreatorState>) {
  return create<ColumnCreatorStore>()(
    computed((set: SetFn): ColumnCreatorStore => {
      return {
        info: initialState.info ?? {
          name: "New column",
          range: [0, 100],
          axisType: ColumnAxisType.HEIGHT, // Default value
        },
        ...initialState,
        data: initialState.initialData,
        setUnits: (units) => {
          // Sort units by their bottom position
          set((state) => ({
            ...state,
            data: {
              ...state.data,
              units,
            },
          }));
        },
        updateState: (spec) => {
          set((state) => {
            return update(state, spec);
          });
        },
        updateInfo: (spec) => {
          set((state) => {
            return { ...state, info: update(state.info, spec) };
          });
        },
        setSurfaces: (surfaces) => {
          set((state) => {
            return { ...state, data: { ...state.data, surfaces } };
          });
        },
      };
    })
  );
}

interface RealizedUnit {
  unit_id: number;
  b_pos: number;
  t_pos: number;
  unit_name: string;
  color: string;
  patternID: string;
  errors: string[];
}

function computeRealizedUnits(data: ColumnCreatorData): RealizedUnit[] {
  // Sort surfaces by height
  const surfaces = data.surfaces.sort((a, b) => a.height - b.height);

  // Create a mapping of surface ID to height
  const surfaceMap: Record<string, number> = {};
  surfaces.forEach((surface) => {
    surfaceMap[surface.id] = surface.height;
  });

  // Create realized units by hanging units on surfaces

  const u1 = data.units.map((unit, i) => {
    const b_pos = surfaceMap[unit.b_surface];
    const t_pos = surfaceMap[unit.t_surface];

    let errors: string[] = [];
    if (b_pos == null) {
      errors.push(`Bottom surface "${unit.b_surface}" not found.`);
    }
    if (t_pos == null) {
      errors.push(`Top surface "${unit.t_surface}" not found.`);
    }
    if (b_pos != null && t_pos != null && b_pos >= t_pos) {
      errors.push(
        `Bottom position (${b_pos}) must be less than top position (${t_pos}).`
      );
    }

    return {
      unit_id: i + 1, // Assuming unit_id is just an index + 1
      b_pos,
      t_pos,
      unit_name: unit.name ?? "",
      color: unit.color,
      patternID: unit.pattern,
      errors,
    };
  });

  return u1;
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

const defaultState: Partial<ColumnCreatorState> = {
  info: {
    name: "New Column",
    range: [0, 100],
    axisType: ColumnAxisType.HEIGHT, // Default value
  },
  initialData: {
    units: [],
    surfaces: [],
  },
};

export function ColumnCreatorProvider({
  children,
  initialData = {},
}: {
  children: React.ReactNode;
  initialData?: Partial<ColumnCreatorData>;
}) {
  const [store, _] = useState(() =>
    createColumnStore({
      ...defaultState,
      initialData: { ...defaultState.initialData, ...initialData },
    })
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

export type ColumnCreatorExtStore = ColumnCreatorStore & ComputedStore;

export function useSelector<T extends keyof ColumnCreatorExtStore>(
  selector: (state: ColumnCreatorExtStore) => ColumnCreatorExtStore[T]
): ColumnCreatorExtStore[T] {
  const store = useColumnCreatorStore();
  return useStore(store, selector);
}
