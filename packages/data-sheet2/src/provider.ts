import { createContext, useContext, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, useStore } from "zustand";
import type { FocusedCellCoordinates, Region } from "@blueprintjs/table";

export interface DataSheetState<T> {
  selection: Region[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  updatedData: T[];
}

interface DataSheetStore<T> extends DataSheetState<T> {
  setSelection: (selection: Region[]) => void;
  setFillValueBaseCell: (cell: FocusedCellCoordinates | null) => void;
  setUpdatedData: (data: T[]) => void;
}

const DataSheetContext = createContext(null);

export function DataSheetProvider<T>({ children }) {
  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>((set) => {
      return {
        selection: [],
        fillValueBaseCell: null,
        updatedData: [],
        focusedCell: null,
        setSelection(selection: Region[]) {
          const focusedCell = singleFocusedCell(selection);
          let spec: Partial<DataSheetState<T>> = { selection, focusedCell };
          if (focusedCell != null) {
            spec.fillValueBaseCell = null;
          }
          set(spec);
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
  selector: (state: DataSheetStore<T>) => A
): A {
  const store = useContext(DataSheetContext);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return useStore(store, selector);
}

export function topLeftCell(
  regions: Region[],
  requireSolitaryCell: boolean = false
): FocusedCellCoordinates | null {
  /** Top left cell of a ranged selection  */
  if (regions == null) return null;
  const [region] = regions;
  if (region == null) return null;
  const { cols, rows } = region;
  if (cols == null || rows == null) return null;
  if (requireSolitaryCell && (cols[0] !== cols[1] || rows[0] !== rows[1]))
    return null;
  return { col: cols[0], row: rows[0], focusSelectionIndex: 0 };
}

function singleFocusedCell(sel: Region[]): FocusedCellCoordinates | null {
  /** Derive a single focused cell from a selected region, if possible */
  if (sel?.length !== 1) return null;
  return topLeftCell(sel, true);
}
