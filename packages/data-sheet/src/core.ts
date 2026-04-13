import { Button, HotkeysProvider, InputGroup } from "@blueprintjs/core";
import {
  Column,
  ColumnHeaderCell,
  Region,
  RegionCardinality,
  RowHeaderCell,
  Table,
  TableProps,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DataSheetAction } from "./components";
import {
  autoFilterId,
  renderColumnHeaderCell,
  SortFilterBar,
} from "./renderers";
import h from "./main.module.sass";
import {
  atom,
  DataSheetProvider,
  storeAtom,
  useAtomValue,
  useSelector,
  useStoreAPI,
} from "./provider";
import {
  DataSheetProviderProps,
  TableElementStatus,
  VisibleCells,
} from "./types.ts";
import { basicCellRenderer } from "./cell-renderer.ts";
import { tableKeyHandlerAtom } from "./utils";
import type { TableAction, TableFilter } from "./actions";
import { ActionsToolbar, FilterBar } from "./actions";

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

export enum DataSheetDensity {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

interface DataSheetInternalProps<T> extends TableProps {
  onVisibleCellsChange?: (visibleCells: VisibleCells) => void;
  onSaveData?: (updatedData: any[], data: T[]) => void;
  onUpdateData?: (updatedData: any[], data: T[]) => void;
  onDeleteRows?: (selection: Region[]) => void;
  verbose?: boolean;
  enableColumnReordering?: boolean;
  enableFocusedCell?: boolean;
  dataSheetActions?: ReactNode | null;
  editable?: boolean;
  autoFocusEditor?: boolean;
  density?: DataSheetDensity;
  /** Configurable table actions shown in a selection-aware toolbar.
   * When provided, the actions toolbar renders alongside the existing
   * edit toolbar. Actions are filtered by the current selection cardinality. */
  actions?: TableAction<T>[];
  /** Available column/table filters shown in a filter bar.
   * Filters can also be defined per-column via `ColumnSpec.filters`. */
  filters?: TableFilter<T>[];
  /** Optional custom column header cell renderer, called for each column.
   * Receives the ColumnSpec and column index; should return a React element
   * (typically a Blueprint ColumnHeaderCell). */
  columnHeaderCellRenderer?: (col: any, colIndex: number) => ReactNode;
}

type DataSheetProps<T> = DataSheetProviderProps<T> & DataSheetInternalProps<T>;

export function DataSheet<T>(props: DataSheetProps<T>) {
  const {
    data,
    columnSpec,
    columnSpecOptions,
    editable = true,
    enableColumnReordering = false,
    enableFocusedCell = false,
    defaultColumnWidth = 150,
    ...rest
  } = props;

  return h(
    HotkeysProvider,
    h(
      DataSheetProvider<T>,
      {
        data,
        columnSpec,
        columnSpecOptions,
        enableColumnReordering,
        defaultColumnWidth,
        editable,
        ...rest,
      },
      h(_DataSheet, {
        ...rest,
        editable,
        enableColumnReordering,
        enableFocusedCell,
      }),
    ),
  );
}

const deletedRowHeaderStyle = {
  opacity: 0.5,
  textDecoration: "line-through",
};

function _DataSheet<T>({
  onVisibleCellsChange,
  onSaveData,
  onUpdateData,
  onDeleteRows,
  verbose = false,
  dataSheetActions = null,
  enableFocusedCell,
  autoFocusEditor = true,
  density = DataSheetDensity.HIGH,
  selectionModes,
  actions,
  filters,
  columnHeaderCellRenderer,
  ...rest
}: DataSheetInternalProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const selectedRegions = useSelector<T>((state) => state.selection ?? []);

  const data = useSelector((state) => state.data);
  const editable = useSelector((state) => state.editable);

  const rowStatus = useSelector((state) => state.rowStatus);

  const focusedCell = useSelector((state) => state.focusedCell);

  const ref = useSelector((state) => state.tableRef);

  const columnSpec = useSelector((state) => state.columnSpec);

  // A sparse array to hold updates
  // TODO: create a "changeset" concept to facilitate undo/redo
  const updatedData = useSelector((state) => state.updatedData);

  const onSelection = useSelector((state) => state.onSelection);

  const storeAPI = useStoreAPI<T>();

  const setVisibleCells = useSelector((state) => state.setVisibleCells);

  const _onVisibleCellsChange = useCallback(
    (visibleCells: VisibleCells) => {
      setVisibleCells(visibleCells);
      onVisibleCellsChange?.(visibleCells);
    },
    [onVisibleCellsChange, setVisibleCells],
  );

  useEffect(() => {
    if (!verbose) return;
    console.log("Updated data", updatedData);
  }, [updatedData]);

  useEffect(() => {
    onUpdateData?.(updatedData, data);
  }, [onUpdateData, data, updatedData]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Selected regions", selectedRegions);
  }, [selectedRegions]);

  const columnWidths = useAtomValue(columnWidthsAtom);

  // When filters are active, only show matching rows
  const filteredRowIndices = useSelector((state) => state.filteredRowIndices);
  const totalRows = Math.max(updatedData.length, data.length);
  const numRows =
    filteredRowIndices != null ? filteredRowIndices.length : totalRows;

  let className = `${density}-density`;

  let rowHeight = 20;
  let defaultColumnWidth = 150;
  let style = {
    "--data-sheet-row-height": "20px",
    "--data-sheet-font-size": "12px",
  };
  if (density === DataSheetDensity.MEDIUM) {
    rowHeight = 24;
    style = {
      "--data-sheet-row-height": "24px",
      "--data-sheet-font-size": "14px",
    };
  } else if (density === DataSheetDensity.LOW) {
    rowHeight = 30;
    style = {
      "--data-sheet-row-height": "30px",
      "--data-sheet-font-size": "18px",
    };
  }

  const onColumnsReordered = useSelector((state) => state.onColumnsReordered);

  // Auto-detect if any columns have sortable/filterable set.
  // If so and no explicit columnHeaderCellRenderer was provided,
  // use the built-in client-side sort/filter header.
  const hasSortableOrFilterable = useMemo(
    () => columnSpec.some((col) => col.sortable || col.filterable),
    [columnSpec],
  );

  const columnSorts = useSelector((state) => state.columnSorts);
  const activeFilters = useSelector((state) => state.activeFilters);

  const children = useMemo(() => {
    return columnSpec.map((col, colIndex) => {
      let fn =
        col.headerCellRenderer ??
        columnHeaderCellRenderer ??
        renderColumnHeaderCell;
      let activeSort = null;
      let activeFilter = null;
      if (col.sortable) {
        activeSort = columnSorts?.find((s) => s.key === col.key);
      }
      if (col.filterable) {
        // The autoFilterID implementation is too complicated
        activeFilter =
          activeFilters?.get(col.key) ??
          activeFilters?.get(autoFilterId(col.key));
      }

      const _columnHeaderCellRenderer = (colIndex) => {
        return fn({
          col,
          colIndex,
          activeSort,
          activeFilter,
        });
      };

      return h(Column, {
        name: col.name,
        columnHeaderCellRenderer: _columnHeaderCellRenderer,
        cellRenderer: (rowIndex) => {
          const state = storeAPI.getState();
          return basicCellRenderer<T>(
            rowIndex,
            colIndex,
            col,
            state,
            autoFocusEditor,
            filteredRowIndices,
          );
        },
      });
    });
  }, [
    columnSpec,
    columnSorts,
    activeFilters,
    storeAPI,
    autoFocusEditor,
    filteredRowIndices,
    columnHeaderCellRenderer,
  ]);

  const onColumnWidthChanged = useSelector(
    (state) => state.onColumnWidthChanged,
  );

  const rowHeaderCellRenderer = useCallback(
    (rowIndex: number) => {
      const dataRowIndex =
        filteredRowIndices != null
          ? (filteredRowIndices[rowIndex] ?? rowIndex)
          : rowIndex;
      const style =
        rowStatus[dataRowIndex] == TableElementStatus.DELETED
          ? deletedRowHeaderStyle
          : null;

      return h(RowHeaderCell, {
        enableRowReordering: false,
        index: rowIndex,
        name: `${dataRowIndex + 1}`,
        style,
      });
    },
    [rowStatus, filteredRowIndices],
  );

  const onKeyDown = useAtomValue(tableKeyHandlerAtom);

  let _selectionModes = selectionModes;
  if (
    editable &&
    _selectionModes != null &&
    !_selectionModes.includes(RegionCardinality.CELLS)
  ) {
    _selectionModes = [..._selectionModes, RegionCardinality.CELLS];
    // Ensure selection mode includes "cells"
  }

  const cellRendererDependencies = [
    data,
    updatedData,
    focusedCell,
    rowStatus,
    filteredRowIndices,
  ];

  return h("div.data-sheet-container", { className, style }, [
    h.if(actions != null)(ActionsToolbar, { actions }),
    h.if(filters != null && filters.length > 0)(FilterBar, { filters }),
    h.if(hasSortableOrFilterable)(SortFilterBar),
    dataSheetActions,
    h(
      "div.data-sheet-holder",
      { onKeyDown },
      h(
        Table,
        {
          ref,
          numRows,
          className: "data-sheet",
          enableFocusedCell,
          onColumnsReordered,
          focusedCell,
          selectedRegions,
          defaultRowHeight: rowHeight,
          minRowHeight: rowHeight,
          columnWidths,
          onColumnWidthChanged,
          onSelection,
          enableRowReordering: false,
          enableRowResizing: false,
          // The cell renderer is memoized internally based on these data dependencies
          cellRendererDependencies,
          onVisibleCellsChange: _onVisibleCellsChange,
          rowHeaderCellRenderer,
          selectionModes: _selectionModes,
          ...rest,
        },
        children,
      ),
    ),
    h(CellRendererDebugOverlay, {
      cellRendererDependencies,
      names: [
        "data",
        "updatedData",
        "focusedCell",
        "rowStatus",
        "filteredRowIndices",
      ],
    }),
  ]);
}

/** Atoms for efficient sub-selection of state */

const columnSpecAtom = atom((get) => get(storeAtom).columnSpec);
const columnWidthsIndexAtom = atom((get) => get(storeAtom).columnWidthsIndex);
const defaultColumnWidthAtom = atom((get) => get(storeAtom).defaultColumnWidth);

const columnWidthsAtom = atom((get) => {
  const ix = get(columnWidthsIndexAtom);
  return get(columnSpecAtom).map(
    (col) => ix.get(col.key) ?? col.width ?? get(defaultColumnWidthAtom),
  );
});

function CellRendererDebugOverlay({ cellRendererDependencies, names }) {
  /** Debug overlay for cell renderer dependencies */
  const lastRenderDependencies = useRef<any[]>(cellRendererDependencies);
  useEffect(() => {
    let changeDepNames = [];
    for (const [i, dep] of cellRendererDependencies.entries()) {
      if (dep !== lastRenderDependencies.current[i]) {
        changeDepNames.push(names[i]);
      }
    }
    if (changeDepNames.length > 0) {
      console.log(
        "Cell renderer dependencies changed:",
        changeDepNames.join(", "),
      );
    }
    lastRenderDependencies.current = cellRendererDependencies;
  }, cellRendererDependencies);
  return null;
}

export function ScrollToRowControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((state) => state.scrollToRow);

  return h(DataSheetAction, [
    h(InputGroup, {
      type: "number",
      placeholder: "Row number",
      value,
      onValueChange(value) {
        setValue(value);
      },
    }),
    h(
      Button,
      {
        icon: "arrow-right",
        onClick() {
          const row = parseInt(value);
          scrollToRow(row - 1);
        },
      },
      "Scroll to row",
    ),
  ]);
}

export function getRowsToDelete(selection) {
  let rowIndices: number[] = [];
  for (const sel of selection) {
    // This isn't a full-row selection
    if (sel.cols != null) continue;
    if (sel.rows == null) continue;
    const [startIndex, endIndex] = sel.rows;
    for (let i = startIndex; i <= endIndex; i++) {
      rowIndices.push(i);
    }
  }
  return rowIndices;
}

function OurColumnHeaderCell({ col, colIndex, ...rest }) {
  return h(ColumnHeaderCell, { name: col.name });
}
