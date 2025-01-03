import { createContext, useContext, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, useStore } from "zustand";

interface DataSheetState {}

const DataSheetContext = createContext(null);

export function DataSheetProvider({ children }) {
  const [store] = useState(() => {
    return createStore<DataSheetState>((set) => {
      return {};
    });
  });

  return h(DataSheetContext.Provider, { value: store }, children);
}

function useDataSheetStore<T>(selector: (state: DataSheetState) => T): T {
  const store = useContext(DataSheetContext);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return useStore(store, selector);
}
