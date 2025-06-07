import { useContext, createContext, useState } from "react";
import { create, StoreApi, useStore } from "zustand";
import h from "@macrostrat/hyper";

interface ColumnCreatorState {
  units: any[]; // Replace 'any' with a more specific type if available
  sections: any[]; // Replace 'any' with a more specific type if available
  range: [number, number];
  axisType?: string; // Replace 'string' with a more specific type if available
}

interface ColumnCreatorActions {}

type ColumnCreatorStore = ColumnCreatorState & ColumnCreatorActions;

function createColumnStore(initialState: ColumnCreatorState) {
  return create<ColumnCreatorState>()((set) => {
    return initialState;
  });
}

const ColumnCreatorStoreContext =
  createContext<StoreApi<ColumnCreatorStore> | null>(null);

const initialState: ColumnCreatorState = {
  units: [],
  sections: [],
  range: [0, 100],
  axisType: "height", // Default value, can be changed
};

export function ColumnCreatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, _] = useState(() => createColumnStore(initialState));

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
