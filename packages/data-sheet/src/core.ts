import {
  Button,
  ButtonGroup,
  HotkeysProvider,
  InputGroup,
  Intent,
} from "@blueprintjs/core";
import {
  Column,
  Region,
  RegionCardinality,
  RowHeaderCell,
  Table,
  TableProps,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import update from "immutability-helper";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { DataSheetAction } from "./components";
import h from "./main.module.sass";
import {
  DataSheetProvider,
  storeAtom,
  useAtomValue,
  useSelector,
  useStoreAPI,
  atom,
} from "./provider";
import { DataSheetProviderProps, VisibleCells } from "./types.ts";
import { basicCellRenderer } from "./cell-renderer.ts";
import { selectAtom } from "jotai/utils";
import { tableKeyHandlerAtom } from "./utils";

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
  ...rest
}: DataSheetInternalProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const selectedRegions = useSelector<T>((state) => state.selection);

  const data = useSelector((state) => state.data);
  const editable = useSelector((state) => state.editable);

  const deletedRows = useSelector((state) => state.deletedRows);

  const focusedCell = useSelector((state) => state.focusedCell);

  const ref = useSelector((state) => state.tableRef);

  const columnSpec = useSelector((state) => state.columnSpec);

  // A sparse array to hold updates
  // TODO: create a "changeset" concept to facilitate undo/redo
  const updatedData = useSelector((state) => state.updatedData);
  const setUpdatedData = useSelector((state) => state.setUpdatedData);

  const onSelection = useSelector((state) => state.onSelection);

  const storeAPI = useStoreAPI<T>();

  const _onSaveData = useMemo(() => {
    if (onSaveData == null) return null;
    return () => {
      onSaveData(updatedData, data);
      setUpdatedData([]);
    };
  }, [updatedData, data, onSaveData]);

  const setVisibleCells = useSelector((state) => state.setVisibleCells);

  const _onVisibleCellsChange = useCallback(
    (visibleCells: VisibleCells) => {
      setVisibleCells(visibleCells);
      onVisibleCellsChange?.(visibleCells);
    },
    [onVisibleCellsChange, setVisibleCells],
  );

  const onAddRow = useCallback(() => {
    setUpdatedData((updatedData: any[]): any[] => {
      const ix = Math.max(updatedData.length, data.length);
      const addRowSpec = { [ix]: { $set: {} } };
      const newUpdatedData = update(updatedData, addRowSpec);
      return newUpdatedData;
    });
  }, [setUpdatedData]);

  const deleteSelectedRows = useSelector((state) => state.deleteSelectedRows);
  const _onDeleteRows = useCallback(() => {
    deleteSelectedRows();
    onDeleteRows?.(selectedRegions);
  }, [onDeleteRows, selectedRegions, deleteSelectedRows]);

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

  const nDeletionCandidates = useMemo(
    () => getRowsToDelete(selectedRegions).length,
    [selectedRegions],
  );

  const columnWidths = useAtomValue(columnWidthsAtom);

  const numRows = Math.max(updatedData.length, data.length);

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

  const children = useMemo(() => {
    return columnSpec.map((col, colIndex) => {
      return h(Column, {
        name: col.name,
        cellRenderer: (rowIndex) => {
          const state = storeAPI.getState();
          return basicCellRenderer<T>(
            rowIndex,
            colIndex,
            col,
            state,
            autoFocusEditor,
          );
        },
      });
    });
  }, [columnSpec, storeAPI, autoFocusEditor]);

  const onColumnWidthChanged = useSelector(
    (state) => state.onColumnWidthChanged,
  );

  const rowHeaderCellRenderer = useCallback(
    (rowIndex: number) => {
      const style = deletedRows.has(rowIndex) ? deletedRowHeaderStyle : null;

      return h(RowHeaderCell, {
        enableRowReordering: false,
        index: rowIndex,
        name: `${rowIndex + 1}`,
        style,
      });
    },
    [deletedRows],
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

  return h("div.data-sheet-container", { className, style }, [
    h.if(editable)(DataSheetEditToolbar, {
      onSaveData: _onSaveData,
      onDeleteRows: nDeletionCandidates > 0 ? _onDeleteRows : null,
    }),
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
          cellRendererDependencies: [
            data,
            //selection,
            updatedData,
            focusedCell,
            deletedRows,
          ],
          onVisibleCellsChange: _onVisibleCellsChange,
          rowHeaderCellRenderer,
          selectionModes: _selectionModes,
          ...rest,
        },
        children,
      ),
    ),
  ]);
}

const hasUpdatesAtom = atom((get) => {
  // Readable atom to indicate whether there are any updates in the updatedData array
  const state = get(storeAtom);
  return state.updatedData.length > 0 || state.deletedRows.size > 0;
});

const columnSpecAtom = atom((get) => get(storeAtom).columnSpec);
const columnWidthsIndexAtom = atom((get) => get(storeAtom).columnWidthsIndex);
const defaultColumnWidthAtom = atom((get) => get(storeAtom).defaultColumnWidth);

const columnWidthsAtom = atom((get) => {
  const ix = get(columnWidthsIndexAtom);
  return get(columnSpecAtom).map(
    (col) => ix.get(col.key) ?? col.width ?? get(defaultColumnWidthAtom),
  );
});

function DataSheetEditToolbar({ onSaveData, onDeleteRows }) {
  const selection = useSelector((state) => state.selection);
  const resetChanges = useSelector((state) => state.resetChanges);

  const hasUpdates = useAtomValue(hasUpdatesAtom);

  return h("div.data-sheet-toolbar", [
    h(ButtonGroup, { minimal: true }, [
      h(AddRowButton),
      h(
        Button,
        {
          intent: Intent.DANGER,
          disabled: onDeleteRows == null,
          onClick() {
            onDeleteRows?.();
          },
        },
        "Delete",
      ),
    ]),
    h("div.spacer"),
    h(ButtonGroup, [
      h(
        Button,
        {
          intent: Intent.WARNING,
          disabled: !hasUpdates,
          onClick: resetChanges,
        },
        "Reset",
      ),
      h.if(onSaveData != null)(
        Button,
        {
          intent: Intent.SUCCESS,
          icon: "floppy-disk",
          disabled: !hasUpdates,
          onClick: onSaveData,
        },
        "Save",
      ),
    ]),
  ]);
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

function AddRowButton() {
  const addRow = useSelector((state) => state.addRow);
  return h(
    Button,
    {
      icon: "plus",
      onClick: addRow,
    },
    "Add row",
  );
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
