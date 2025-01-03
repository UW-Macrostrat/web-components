import { createContext, useContext, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, useStore } from "zustand";
import type { FocusedCellCoordinates, Region } from "@blueprintjs/table";

export interface DataSheetState<T> {
  selection: Region[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  updatedData: T[];
  setSelection: (selection: Region[]) => void;
  setFillValueBaseCell: (cell: FocusedCellCoordinates | null) => void;
  setUpdatedData: (data: T[]) => void;
}

const DataSheetContext = createContext(null);

export function DataSheetProvider<T>({ children }) {
  const [store] = useState(() => {
    return createStore<DataSheetState<T>>((set) => {
      return {
        selection: [],
        fillValueBaseCell: null,
        updatedData: [],
        setSelection(selection: Region[]) {
          set({ selection });
        },
        setUpdatedData(data: T[]) {
          set({ updatedData: data });
        },
        setFillValueBaseCell(cell: FocusedCellCoordinates | null) {
          set({ fillValueBaseCell: cell });
        },
      };
    });
  });

  return h(DataSheetContext.Provider, { value: store }, children);
}

export function useSelector<T = any, A = any>(
  selector: (state: DataSheetState<T>) => A
): A {
  const store = useContext(DataSheetContext);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return useStore(store, selector);
}
