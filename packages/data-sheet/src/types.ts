import type {
  FocusedCellCoordinates,
  Region,
  Table2,
} from "@blueprintjs/table";
import { ColumnSpec, ColumnSpecOptions } from "./utils";

export interface DataSheetCoreProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  editable?: boolean;
  enableColumnReordering?: boolean;
  defaultColumnWidth?: number;
}

export interface DataSheetState<T> {
  selection: Region[];
  columnSpec: ColumnSpec[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  topLeftCell: FocusedCellCoordinates | null;
  deletedRows: Set<number>;
  // Sparse data structure for updated data
  updatedData: T[];
  initialized: boolean;
  columnWidthsIndex: Map<string, number>;
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;
export type StateUpdater<T> = T[] | ((state: T[]) => T[]);

export interface DataSheetStoreMain<T> extends DataSheetVals<T> {
  setSelection(selection: Region[]): void;
  onDragValue(event: MouseEvent): void;
  setUpdatedData(data: StateUpdater<T>): void;
  onCellEdited(rowIndex: number, columnName: string, value: any): void;
  onSelectionEdited(value: any): void;
  onColumnsReordered(oldIndex: number, newIndex: number, length: number): void;
  onColumnWidthChanged(columnIndex: number, newWidth: number): void;
  moveFocusedCell(direction: "up" | "down" | "left" | "right"): void;
  deleteSelectedRows(): void;
  clearSelection(): void;
  resetChanges(): void;
  addRow(): void;
  initialize(props: DataSheetCoreProps<T>): void;
  onSelection(selection: Region[]): void;
  // Internal method used for infinite scrolling
  setVisibleCells(visibleCells: VisibleCells): void;
  scrollToRow(rowIndex: number): void;
  tableRef: React.MutableRefObject<Table2>;
  visibleCellsRef: React.MutableRefObject<VisibleCells>;
  columnWidthsIndex: Map<string, number>;
  defaultColumnWidth: number;
}

export type DataSheetProviderProps<T> = DataSheetCoreProps<T> & {
  children: React.ReactNode;
  columnSpecOptions?: ColumnSpecOptions<T>;
};

export interface VisibleCells {
  rowIndexStart: number;
  rowIndexEnd: number;
}

export interface DataSheetComputedVals {
  hasUpdates: boolean;
  /** State for column widths (if resized).
   * This will reset if the columnSpec prop changes
   */
  columnWidths: number[];
  tableKeyHandler: (evt: React.KeyboardEvent) => void;
  editorKeyHandler: (evt: React.KeyboardEvent) => void;
  isSingleCellSelection?: boolean;
}

export type DataSheetStore<T> = DataSheetComputedVals & DataSheetStoreMain<T>;
