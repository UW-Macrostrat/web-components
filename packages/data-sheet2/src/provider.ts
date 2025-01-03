import { createContext, useContext, useEffect, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type { FocusedCellCoordinates, Region } from "@blueprintjs/table";
import { generateColumnSpec } from "./utils";
import update, { Spec } from "immutability-helper";
import { range } from "./utils";

export interface ColumnSpec {
  name: string;
  key: string;
  required?: boolean;
  isValid?: (d: any) => boolean;
  transformValue?: (d: any) => any;
  valueRenderer?: (d: any) => string | React.ReactNode;
  dataEditor?: any;
  cellComponent?: any;
  category?: string;
  editable?: boolean;
  inlineEditor?: boolean | React.ComponentType<any> | string | null;
  style?: React.CSSProperties;
}

export interface ColumnSpecOptions {
  overrides: Record<string, Partial<ColumnSpec> | string>;
  data?: any[]; // Data to use for type inference
  nRows?: number; // Number of rows to use for type inference
  omitColumns?: string[]; // Columns to omit. Takes precedence over includeColumns.
  includeColumns?: string[]; // Columns to include.
}

export interface DataSheetCoreProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  editable?: boolean;
}

export interface DataSheetState<T> {
  selection: Region[];
  columnSpec: ColumnSpec[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  topLeftCell: FocusedCellCoordinates | null;
  updatedData: T[];
  initialized: boolean;
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;

export interface DataSheetStore<T> extends DataSheetVals<T> {
  setSelection: (selection: Region[]) => void;
  setFillValueBaseCell: (cell: FocusedCellCoordinates | null) => void;
  setUpdatedData: (data: T[]) => void;
  onCellEdited: (rowIndex: number, columnName: string, value: any) => void;
  initialize: (props: DataSheetCoreProps<T>) => void;
}

export type DataSheetProviderProps<T> = DataSheetCoreProps<T> & {
  children: React.ReactNode;
  columnSpecOptions?: ColumnSpecOptions;
};

const DataSheetContext = createContext<StoreApi<DataSheetStore<any>>>(null);

export function DataSheetProvider<T>({
  children,
  data,
  columnSpec,
  columnSpecOptions,
  editable,
}: DataSheetProviderProps<T>) {
  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>((set) => {
      return {
        data,
        columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
        editable,
        selection: [],
        fillValueBaseCell: null,
        updatedData: [],
        focusedCell: null,
        topLeftCell: null,
        initialized: false,
        setSelection(selection: Region[]) {
          const focusedCell = singleFocusedCell(selection);
          let spec: Partial<DataSheetState<T>> = {
            selection,
            focusedCell,
            topLeftCell: topLeftCell(selection),
          };
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
        onCellEdited(rowIndex: number, columnName: string, value: any) {
          set((state) => {
            const { editable, updatedData, data } = state;
            if (!editable) return {};
            let rowSpec: any;
            // Check to see if the new value is the same as the old one
            if (value !== data[rowIndex]?.[columnName]) {
              const rowOp = updatedData[rowIndex] != null ? "$merge" : "$set";
              rowSpec = { [rowOp]: { [columnName]: value } };
            } else {
              rowSpec = { $unset: [columnName] };
            }
            const spec: Spec<T[]> = { [rowIndex]: rowSpec };
            return { updatedData: update(updatedData, spec) };
          });
        },
        initialize(props: DataSheetCoreProps<T>) {
          set({ ...props, initialized: true });
        },
      };
    });
  });

  // Not sure how required this initialization is
  useEffect(() => {
    const { initialize } = store.getState();
    initialize({
      data,
      columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
      editable,
    });
  }, [data, editable, columnSpec, columnSpecOptions]);

  return h(DataSheetContext.Provider, { value: store }, children);
}

export function useStoreAPI<T>(): StoreApi<DataSheetStore<T>> {
  const store = useContext(DataSheetContext);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return store;
}

export function useSelector<T = any, A = any>(
  selector: (state: DataSheetStore<T>) => A
): A {
  const store = useStoreAPI<T>();
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
