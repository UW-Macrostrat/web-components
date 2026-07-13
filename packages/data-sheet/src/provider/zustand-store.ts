import {
  DataSheetState,
  DataSheetStore,
  DataSheetStoreMain,
  DEFAULT_ROW_STATUS_STYLES,
  DS_ROW_ID,
  StateUpdater,
  TableElementStatus,
  VisibleCells,
} from "./types.ts";
import {
  type FocusedCellCoordinates,
  type Region,
  RegionCardinality,
} from "@blueprintjs/table";
import { range } from "../utils";
import update, { Spec } from "immutability-helper";
import {
  getSelectedColumnKeys,
  getSelectedRowIndices,
  getSelectionCardinality,
} from "../actions";

/** Monotonic counter for synthetic ids on in-table-added rows. */
let _addedRowCounter = 0;

export function createZustandStore<T>(set, get): DataSheetStoreMain<T> {
  return {
    /** All the data in the table */
    data: [],
    updatedData: [],
    rowStatus: [],
    rowStatusStyles: DEFAULT_ROW_STATUS_STYLES,
    columnSpec: [],
    deferColumnSpec: false,
    defaultColumnWidth: 150,
    editable: false,
    selection: [],
    fillValueBaseCell: null,
    focusedCell: null,
    topLeftCell: null,
    initialized: false,
    tableRef: null,
    // This is a placeholder
    enableColumnReordering: false,
    activeFilters: new Map<string, { filter: any; state: any }>(),
    columnSorts: [],
    clipboardProxy: null,
    filteredRowIndices: null,
    cellInteraction: "auto",
    autoActivateArmed: true,
    lastNavDirection: null,
    tableElement: null,
    cellSurfaceOpen: false,
    identity: (row: any) => row?.id,
    pendingOverlayById: new Map(),
    controlledOverlay: false,
    canDeleteRows: true,
    setSelection(selection: Region[]) {
      set(updateSelection(selection));
    },
    columnWidthsIndex: new Map<string, number>(),
    suppressAutoActivate() {
      set({ autoActivateArmed: false });
    },
    armAutoActivate() {
      set({ autoActivateArmed: true });
    },
    openCellSurface() {
      set({ cellSurfaceOpen: true });
    },
    closeCellSurface(opts?: { suppress?: boolean }) {
      const suppress = opts?.suppress ?? true;
      set((state) => ({
        cellSurfaceOpen: false,
        // Escape (suppress) drops auto mode into navigation mode so surfaces
        // stop auto-opening until the next click. A click-dismiss doesn't.
        autoActivateArmed:
          suppress && state.cellInteraction === "auto"
            ? false
            : state.autoActivateArmed,
      }));
    },
    moveFocusedCell(direction: "up" | "down" | "left" | "right") {
      set((state) => {
        const { topLeftCell } = state;
        if (topLeftCell == null) return {};
        let { col, row } = topLeftCell;
        switch (direction) {
          case "up":
            row = Math.max(0, row - 1);
            break;
          case "down":
            row = Math.min(
              row + 1,
              Math.max(state.data.length, state.updatedData.length) - 1,
            );
            break;
          case "left":
            col = Math.max(0, col - 1);
            break;
          case "right":
            col = Math.min(col + 1, state.columnSpec.length - 1);
            break;
        }
        const region: Region = { cols: [col, col], rows: [row, row] };
        // Record the travel direction (so the next editor places its cursor on
        // the side we're moving toward) and open the new cell's surface only
        // when auto-activation is armed.
        return {
          ...updateSelection([region]),
          lastNavDirection: direction,
          cellSurfaceOpen:
            state.cellInteraction === "auto" && state.autoActivateArmed,
        };
      });
    },
    addRow(row: Partial<T> = {} as T) {
      /** Add a new row. If there is a selection, use the last row index to determine
       * where to insert the new row. Otherwise, append to the end of the data. */
      let newIndex = -1;
      set((state) => {
        const { updatedData, data, selection, rowStatus } = state;

        const lastRowIndex =
          getLastRowIndex(selection) ??
          Math.max(data.length, updatedData.length) - 1;
        // Use $set at a specific index to correctly extend the sparse array.
        // $splice fails when the target index exceeds the array length.
        newIndex = lastRowIndex + 1;

        // Stamp a stable synthetic id so the added row survives a provider
        // re-fetch (it has no provider row to match on). Its values live in the
        // overlay (`updatedData`), which the loader-boundary remap re-appends.
        const newRow = {
          ...(row as any),
          [DS_ROW_ID]: `__added_${_addedRowCounter++}`,
        } as T;

        return {
          updatedData: insertItemAtIndex(updatedData, newIndex, newRow),
          data: insertItemAtIndex(data, newIndex, newRow),
          rowStatus: insertItemAtIndex(
            rowStatus,
            newIndex,
            TableElementStatus.ADDED,
          ),
        };
      });
      get().onEdit?.({ type: "addRow", rowIndex: newIndex, value: row });
    },
    setUpdatedData(data: StateUpdater<T>) {
      if (Array.isArray(data)) {
        set({ updatedData: data });
      } else {
        set((state) => {
          return { updatedData: data(state.updatedData) };
        });
      }
    },
    deleteSelectedRows() {
      // Deletion is a provider capability: if the active data provider can't
      // delete (no `deleteRows`), the whole affordance is disabled.
      if (!get().canDeleteRows) return;
      // Remove selected rows from the data and updatedData arrays
      let deletedIndices: number[] = [];
      set((state) => {
        const { selection, deletedRows } = state;
        const rowIndices = getRowIndices(selection);
        deletedIndices = rowIndices;

        // Delete rows from both updatedData and data

        // If rows are in addedRows, we just delete them outright from the data and updatedData arrays
        const { addedRows } = state;

        const rowsNewlyDeleted = new Set(rowIndices);

        // We outright remove rows that have not been added to the data array
        const rowsToRemoveFromDataArrays = new Set(
          rowIndices.filter(
            (d) => state.rowStatus[d] == TableElementStatus.ADDED,
          ),
        );
        // ...otherwise we set them to 'deleted'
        const rowsToMarkAsDeleted = rowsNewlyDeleted.difference(
          rowsToRemoveFromDataArrays,
        );

        let data = state.data;
        let updatedData = state.updatedData;
        let rowStatus = state.rowStatus;
        if (rowsToMarkAsDeleted.size > 0) {
          let spec: Spec<TableElementStatus[]> = {};
          for (const ix of rowsToMarkAsDeleted) {
            spec[ix] = { $set: TableElementStatus.DELETED };
          }
          rowStatus = update(rowStatus, spec);
        }

        if (rowsToRemoveFromDataArrays.size > 0) {
          const filterFunc = (_, i) => !rowsToRemoveFromDataArrays.has(i);
          data = data.filter(filterFunc);
          updatedData = updatedData.filter(filterFunc);
          rowStatus = rowStatus.filter(filterFunc);
        }

        // Remove selected rows and reset selection
        return {
          selection: [],
          data,
          updatedData,
          rowStatus,
          focusedCell: null,
          topLeftCell: null,
          fillValueBaseCell: null,
        };
      });
      if (deletedIndices.length > 0) {
        get().onEdit?.({ type: "deleteRows", rowIndices: deletedIndices });
      }
    },
    resetChanges(regions?: Region[]) {
      // Reset the updated data to the initial data
      set((state) => resetChangesForSelection(state, regions));
      get().onEdit?.({ type: "resetChanges" });
    },
    onColumnWidthChanged(columnIx: number, newWidth: number) {
      set((state) => {
        const { columnSpec, columnWidthsIndex } = state;
        const colKey = columnSpec[columnIx].key;
        const newColumnWidths = new Map(columnWidthsIndex);
        newColumnWidths.set(colKey, newWidth);
        return { columnWidthsIndex: newColumnWidths };
      });
    },
    onDragValue(event: MouseEvent) {
      set((state) => {
        return { fillValueBaseCell: state.focusedCell };
      });
      event.preventDefault();
    },
    onCellEdited(rowIndex: number, columnName: string, value: any) {
      set((state) => {
        const { editable, updatedData, data } = state;
        if (!editable) return {};
        let rowSpec: any;

        // Check to see if the new value is meaningfully different from the old
        // one. Empty string and null/undefined are treated as equivalent, so
        // focusing (and blurring) an empty cell doesn't record a phantom edit.
        const oldValue = data[rowIndex]?.[columnName];
        if (!valuesAreEquivalent(value, oldValue)) {
          const rowOp = updatedData[rowIndex] != null ? "$merge" : "$set";
          rowSpec = { [rowOp]: { [columnName]: value } };
        } else if (updatedData[rowIndex] != null) {
          // No change — drop any prior override for this cell.
          rowSpec = { $unset: [columnName] };
        } else {
          // No change and no prior override: nothing to do. (`$unset` on an
          // absent row would throw in immutability-helper.)
          return {};
        }
        const spec: Spec<T[]> = { [rowIndex]: rowSpec };
        return { updatedData: update(updatedData, spec) };
      });
      if (get().editable) {
        get().onEdit?.({
          type: "setCells",
          cells: [
            { rowIndex, column: columnName, value, row: get().data[rowIndex] },
          ],
        });
      }
    },
    clearSelection() {
      const edits: {
        rowIndex: number;
        column: string;
        value: any;
        row?: any;
      }[] = [];
      set((state) => {
        // Delete all selected cells
        const { selection, updatedData, columnSpec, data } = state;
        const numVisible = visibleRowCount(state);
        let spec = {};
        for (const region of selection) {
          const { cols, rows } = region;
          const rowRange = range(rows ?? [0, numVisible - 1]);
          const colRange = range(cols ?? [0, columnSpec.length - 1]);
          for (const visibleRow of rowRange) {
            // Selection indices are visible positions; map to the data row.
            const row = toDataRowIndex(state, visibleRow);
            // Don't clear row if it has been deleted
            const rowIsDeleted =
              state.rowStatus[row] === TableElementStatus.DELETED;
            if (rowIsDeleted) continue;
            let vals = {};
            for (const col of colRange) {
              const key = columnSpec[col].key;
              const currentValue = updatedData[row]?.[key] ?? data[row]?.[key];
              if (currentValue != null && currentValue !== "") {
                vals[key] = "";
                edits.push({
                  rowIndex: row,
                  column: key,
                  value: "",
                  row: data[row],
                });
              }
            }
            let op = updatedData[row] == null ? "$set" : "$merge";
            spec[row] = { [op]: vals };
          }
        }
        return {
          updatedData: update(updatedData, spec),
        };
      });
      if (edits.length > 0) {
        get().onEdit?.({ type: "setCells", cells: edits });
      }
    },
    onSelection(selection: Region[]) {
      set((state) => {
        if (
          selectionEquals(selection, state.selection) &&
          singleFocusedCell(selection) == null // Only if we're in a multi-cell selection mode
        ) {
          // If the selection is the same as the current selection, remove the selection.
          // In practice this only happens for whole-row and whole-column selections
          return {
            selection: [],
            focusedCell: null,
            topLeftCell: null,
            fillValueBaseCell: null,
            cellSurfaceOpen: false,
          };
        }

        let spec = updateSelection(selection);
        if (state.fillValueBaseCell != null) {
          spec.updatedData = fillValues(state, selection);
        }
        // A click (user selection) re-arms auto-activation and clears the
        // travel direction so the editor opens with a default cursor.
        spec.autoActivateArmed = true;
        spec.lastNavDirection = null;
        // Only open when the selection actually MOVES to a (single) cell.
        // A click on the already-selected cell leaves open-state to the
        // target's click toggle — this avoids racing the selection event
        // (which fires on mousedown, possibly more than once) and is what
        // makes both re-focus-to-open and click-to-close reliable.
        if (!selectionEquals(selection, state.selection)) {
          spec.cellSurfaceOpen = singleFocusedCell(selection) != null;
        }
        return spec;
      });
    },
    onSelectionEdited(value: any) {
      // Apply the same value to all selected cells
      const edits: {
        rowIndex: number;
        column: string;
        value: any;
        row?: any;
      }[] = [];
      set((state) => {
        const { selection, updatedData, columnSpec, editable } = state;
        if (!editable) return {};
        const numVisible = visibleRowCount(state);
        let spec = {};
        for (const region of selection) {
          const { cols, rows } = region;
          const rowRange = range(rows ?? [0, numVisible - 1]);
          const colRange = range(cols ?? [0, columnSpec.length - 1]);
          for (const visibleRow of rowRange) {
            // Selection indices are visible positions; map to the data row.
            const row = toDataRowIndex(state, visibleRow);
            let vals = {};
            for (const col of colRange) {
              const key = columnSpec[col].key;
              vals[key] = value;
              edits.push({
                rowIndex: row,
                column: key,
                value,
                row: state.data[row],
              });
            }
            let op = updatedData[row] == null ? "$set" : "$merge";
            spec[row] = { [op]: vals };
          }
        }
        return {
          updatedData: update(updatedData, spec),
        };
      });
      if (edits.length > 0) {
        get().onEdit?.({ type: "setCells", cells: edits });
      }
    },
    onColumnsReordered(oldIndex: number, newIndex: number, length: number) {
      set((state) => {
        if (!state.enableColumnReordering) return {};
        const { columnSpec } = state;
        const newSpec = [...columnSpec];
        const removed = newSpec.splice(oldIndex, length);
        newSpec.splice(newIndex, 0, ...removed);
        return { columnSpec: newSpec };
      });
    },
    scrollToRow(rowIndex: number) {
      const tableRef = get().tableRef;
      if (tableRef.current == null) return;
      tableRef.current.scrollToRegion({
        rows: [rowIndex, rowIndex],
      });
    },
    // Sort/filter state changes flow to the data provider (via the loader,
    // which reads `activeFilters`/`columnSorts` and re-fetches). The library no
    // longer computes a client-side `filteredRowIndices` view — `data` arrives
    // already ordered from the provider (in memory for a local source).
    setFilter(filterId: string, filter: any, filterState: any) {
      set((state) => {
        const newFilters = new Map<string, { filter: any; state: any }>(
          state.activeFilters,
        );
        newFilters.set(filterId, { filter, state: filterState });
        return { activeFilters: newFilters };
      });
    },
    removeFilter(filterId: string) {
      set((state) => {
        const newFilters = new Map<string, { filter: any; state: any }>(
          state.activeFilters,
        );
        newFilters.delete(filterId);
        return { activeFilters: newFilters };
      });
    },
    clearFilters() {
      set(() => ({
        activeFilters: new Map<string, { filter: any; state: any }>(),
      }));
    },
    setColumnSort(key: string, ascending: boolean | null) {
      set((state) => {
        let newSorts;
        if (ascending == null) {
          newSorts = state.columnSorts.filter((s) => s.key !== key);
        } else {
          const without = state.columnSorts.filter((s) => s.key !== key);
          newSorts = [...without, { key, ascending }];
        }
        return { columnSorts: newSorts };
      });
    },
    clearColumnSorts() {
      set(() => ({ columnSorts: [] }));
    },
    setClipboardProxy(proxy) {
      set({ clipboardProxy: proxy });
    },
  };
}

export function updateSelection<T>(selection: Region[]) {
  const focusedCell = singleFocusedCell(selection);
  let spec: Partial<DataSheetState<T>> = {
    selection,
    focusedCell,
    topLeftCell: topLeftCell(selection),
  };
  if (focusedCell != null) {
    spec.fillValueBaseCell = null;
  }
  return spec;
}

function getLastRowIndex(regions: Region[]): number | null {
  /** Get the last row index from a selection of regions */
  if (regions == null || regions.length === 0) return null;
  let lastRow = -1;
  for (const region of regions) {
    const { rows } = region;
    if (rows == null || rows.length !== 2) continue;
    lastRow = Math.max(lastRow, rows[1]);
  }
  if (lastRow < 0) {
    /** If no valid rows are found, return null */
    return null;
  }
  return lastRow;
}

function getRowIndices(regions: Region[]): number[] {
  /** Get the row indices from a selection of regions */
  if (regions == null || regions.length === 0) return [];
  const rowIndices = new Set<number>();
  for (const region of regions) {
    const { rows } = region;
    if (rows == null || rows.length !== 2) continue;
    for (let i = rows[0]; i <= rows[1]; i++) {
      rowIndices.add(i);
    }
  }
  return Array.from(rowIndices).sort((a, b) => a - b);
}

export function topLeftCell(
  regions: Region[],
  requireSolitaryCell: boolean = false,
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

function selectionEquals(a: Region[], b: Region[]): boolean {
  /** Check if two selections are equal */
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const regionA = a[i];
    const regionB = b[i];

    const colsA = regionA.cols ?? [];
    const colsB = regionB.cols ?? [];

    const rowsA = regionA.rows ?? [];
    const rowsB = regionB.rows ?? [];

    if (
      colsA.length !== colsB.length ||
      rowsA.length !== rowsB.length ||
      colsA[0] !== colsB[0] ||
      colsA[1] !== colsB[1] ||
      rowsA[0] !== rowsB[0] ||
      rowsA[1] !== rowsB[1]
    ) {
      return false;
    }
  }
  return true;
}

export function singleFocusedCell(
  sel: Region[],
): FocusedCellCoordinates | null {
  /** Derive a single focused cell from a selected region, if possible */
  if (sel?.length !== 1) return null;
  return topLeftCell(sel, true);
}

function fillValues<T>(state: DataSheetStore<T>, selection: Region[]) {
  const { updatedData, columnSpec, editable, fillValueBaseCell, data } = state;

  // Prepare regions by unnesting columns
  let regions = selection.map((region) => {
    const { cols, rows } = region;
    // Get the first column (maybe should be the last)
    const [col] = cols;
    return { cols: [col, col], rows };
  });

  // Fill values downwards
  if (!editable || fillValueBaseCell == null) return updatedData;
  const { col, row: baseVisibleRow } = fillValueBaseCell;
  // The base cell and target rows are visible positions; map to data rows.
  const baseRow = toDataRowIndex(state, baseVisibleRow);
  const key = columnSpec[col].key;
  const value = updatedData[baseRow]?.[key] ?? data[baseRow]?.[key];
  const spec = {};
  for (const region of regions) {
    const { rows } = region;
    for (const visibleRow of range(rows)) {
      const row = toDataRowIndex(state, visibleRow);
      let op = updatedData[row] == null ? "$set" : "$merge";
      spec[row] = { [op]: { [key]: value } };
    }
  }
  return update(updatedData, spec);
}

/** Number of rows currently visible (post-filter/sort), or the full data
 * length when no view transform is active. Uses the max of `data` and
 * `updatedData` lengths because `updatedData` is sparse — keying off it alone
 * would stop a whole-column edit at the last already-edited row. */
function visibleRowCount<T>(state: DataSheetStore<T>): number {
  const { filteredRowIndices, updatedData, data } = state;
  return filteredRowIndices != null
    ? filteredRowIndices.length
    : Math.max(data.length, updatedData.length);
}

/** Map a visible (post-filter/sort) row position to its underlying data
 * index. Edit methods receive selection indices in visible space, so they
 * must translate before writing to `updatedData`/`data`. */
function toDataRowIndex<T>(
  state: DataSheetStore<T>,
  visibleRow: number,
): number {
  const { filteredRowIndices } = state;
  if (filteredRowIndices == null) return visibleRow;
  return filteredRowIndices[visibleRow] ?? visibleRow;
}

/** Whether two cell values are equivalent for edit-tracking. Empty string and
 * null/undefined are equivalent (so clearing an empty cell is a no-op), and
 * non-blank values are compared by string form so a text editor's `"42"`
 * matches a numeric base `42` (otherwise the cell reads as edited when its
 * value didn't actually change). */
function valuesAreEquivalent(a: any, b: any): boolean {
  if (a === b) return true;
  const aBlank = a == null || a === "";
  const bBlank = b == null || b === "";
  if (aBlank || bBlank) return aBlank && bBlank;
  return String(a) === String(b);
}

function resetChangesForSelection<T>(
  state: DataSheetStore<T>,
  selection: Region[],
): Partial<DataSheetStore<T>> {
  const emptySelection = {
    selection: [],
    focusedCell: null,
    topLeftCell: null,
    fillValueBaseCell: null,
  };

  const { data } = state;
  const cardinality =
    getSelectionCardinality(selection ?? []) ?? RegionCardinality.FULL_TABLE;

  const rowStatus = [...state.rowStatus];
  const updatedData = [...state.updatedData];
  const addedRows = new Set<number>();

  // Global reset
  switch (cardinality) {
    case RegionCardinality.FULL_TABLE:
      for (let i = 0; i < rowStatus.length; i++) {
        if (rowStatus[i] === TableElementStatus.ADDED) {
          addedRows.add(i);
        }
      }

      return {
        updatedData: [],
        rowStatus: [],
        data: data.filter((_, i) => !addedRows.has(i)),
        ...emptySelection,
      };
    case RegionCardinality.FULL_COLUMNS:
    case RegionCardinality.CELLS:
      /** Columns or cells. Note, these only work the same because we don't
       * allow column deletion, only unsetting all values.
       */
      const columnKeys = getSelectedColumnKeys(selection, state.columnSpec);
      const spec: Spec<Record<string, any>[]> = {};
      const rowIndices =
        cardinality == RegionCardinality.FULL_COLUMNS
          ? Array.from({ length: updatedData.length }, (_, i) => i)
          : getSelectedRowIndices(selection);
      for (const row of rowIndices) {
        if (updatedData[row] == null) continue;
        spec[row] = { $unset: columnKeys };
      }
      // TODO: if we allow column addition/deletion, this will require more adjustment
      return {
        updatedData: update(updatedData, spec),
        ...emptySelection,
      };
    case RegionCardinality.FULL_ROWS:
      for (const row of getSelectedRowIndices(selection)) {
        updatedData[row] = undefined;
        if (state.rowStatus[row] === TableElementStatus.DELETED) {
          rowStatus[row] = undefined;
        } else if (state.rowStatus[row] === TableElementStatus.ADDED) {
          addedRows.add(row);
        }
      }

      const removeCandidateRows = (arr: any[]) => {
        return arr.filter((d, i) => !addedRows.has(i));
      };

      return {
        updatedData: removeCandidateRows(updatedData),
        data: removeCandidateRows(state.data),
        rowStatus: removeCandidateRows(rowStatus),
        ...emptySelection,
      };
  }
}

function insertItemAtIndex<T>(arr: T[], index: number, item: T) {
  if (arr.length < index) {
    const newArr = [...arr];
    newArr.length = index;
    newArr[index] = item;
    return newArr;
  }

  return [...arr.slice(0, index), item, ...arr.slice(index)];
}
