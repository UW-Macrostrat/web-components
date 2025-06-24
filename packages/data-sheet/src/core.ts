import {
  Button,
  ButtonGroup,
  HotkeysProvider,
  InputGroup,
  Intent,
} from "@blueprintjs/core";
import {
  Cell,
  Column,
  Region,
  RowHeaderCell,
  Table2,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import hyper from "@macrostrat/hyper";
import update from "immutability-helper";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { EditorPopup, handleSpecialKeys } from "./components";
import styles from "./main.module.sass";
import {
  ColumnSpec,
  ColumnSpecOptions,
  DataSheetProvider,
  DataSheetProviderProps,
  DataSheetStore,
  singleFocusedCell,
  useSelector,
  useStoreAPI,
  VisibleCells,
} from "./provider";
import { DataSheetAction } from "./components/actions";

export type { ColumnSpec, ColumnSpecOptions };
export * from "./components";

const h = hyper.styled(styles);

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

interface DataSheetInternalProps<T> {
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
    ...rest
  } = props;

  return h(
    HotkeysProvider,
    h(
      DataSheetProvider<T>,
      {
        data,
        columnSpec,
        columnSpecOptions: columnSpecOptions,
        enableColumnReordering,
        editable,
        ...rest,
      },
      h(_DataSheet, {
        ...rest,
        editable,
        enableColumnReordering,
        enableFocusedCell,
      })
    )
  );
}

function _DataSheet<T>({
  onVisibleCellsChange,
  enableColumnReordering,
  onSaveData,
  onUpdateData,
  onDeleteRows,
  verbose = false,
  dataSheetActions = null,
  enableFocusedCell,
  autoFocusEditor = true,
}: DataSheetInternalProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const selection = useSelector<T>((state) => state.selection);

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
    [onVisibleCellsChange, setVisibleCells]
  );

  const onAddRow = useCallback(() => {
    setUpdatedData((updatedData) => {
      const ix = Math.max(updatedData.length, data.length);
      const addRowSpec = { [ix]: { $set: {} } };
      const newUpdatedData = update(updatedData, addRowSpec);
      return newUpdatedData;
    });
  }, [setUpdatedData]);

  const deleteSelectedRows = useSelector((state) => state.deleteSelectedRows);
  const _onDeleteRows = useCallback(() => {
    deleteSelectedRows();
    onDeleteRows?.(selection);
  }, [onDeleteRows, selection, deleteSelectedRows]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Updated data", updatedData);
  }, [updatedData]);

  useEffect(() => {
    onUpdateData?.(updatedData, data);
  }, [onUpdateData, data, updatedData]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Selection", selection);
  }, [selection]);

  if (data == null) return null;

  const nDeletionCandidates = getRowsToDelete(selection).length;

  const numRows = Math.max(updatedData.length, data.length);

  return h("div.data-sheet-container", [
    h.if(editable)(DataSheetEditToolbar, {
      onSaveData: _onSaveData,
      onAddRow,
      onDeleteRows: nDeletionCandidates > 0 ? _onDeleteRows : null,
    }),
    dataSheetActions,
    h(
      "div.data-sheet-holder",
      {
        onKeyDown(e) {
          // General key event
          if (e.key === "Escape") {
            // Clear selection on Escape
            storeAPI.getState().setSelection([]);
            e.preventDefault();
          }
          // Clear selection on Backspace or Delete
          if (e.key === "Backspace" || e.key === "Delete") {
            // Clear selection on Backspace or Delete
            storeAPI.getState().clearSelection();
            e.preventDefault();
          }
          // Handle arrow keys for navigation
          if (e.key.startsWith("Arrow")) {
            // Handle arrow key navigation
            const direction = e.key.replace("Arrow", "").toLowerCase();
            const state = storeAPI.getState();
            state.moveFocusedCell(direction);
            // Prevent default scrolling behavior
            e.preventDefault();
          }
        },
      },
      [
        h(
          Table2,
          {
            ref,
            numRows,
            className: "data-sheet",
            enableFocusedCell,
            enableColumnReordering,
            //onColumnsReordered,
            focusedCell,
            selectedRegions: selection,
            onSelection,
            // The cell renderer is memoized internally based on these data dependencies
            cellRendererDependencies: [
              selection,
              updatedData,
              focusedCell,
              deletedRows,
            ],
            onVisibleCellsChange: _onVisibleCellsChange,
            rowHeaderCellRenderer: (rowIndex) => {
              let style = null;
              let intent = undefined;
              if (deletedRows.has(rowIndex)) {
                style = {
                  opacity: 0.5,
                  textDecoration: "line-through",
                };
              }
              return h(RowHeaderCell, {
                index: rowIndex,
                name: `${rowIndex + 1}`,
                style,
              });
            },
          },
          columnSpec.map((col, colIndex) => {
            return h(Column, {
              name: col.name,
              cellRenderer: (rowIndex) => {
                const state = storeAPI.getState();
                return basicCellRenderer<T>(
                  rowIndex,
                  colIndex,
                  col,
                  state,
                  autoFocusEditor
                );
              },
            });
          })
        ),
      ]
    ),
  ]);
}

function basicCellRenderer<T>(
  rowIndex: number,
  colIndex: number,
  columnSpec: ColumnSpec,
  state: DataSheetStore<T>,
  autoFocusEditor = true
): any {
  const data = state.data;
  const updatedData = state.updatedData;

  const isDeleted = state.deletedRows.has(rowIndex);

  const row = data[rowIndex] ?? updatedData[rowIndex];
  const loading = row == null;
  const col = columnSpec;

  const focusedCell = state.focusedCell;
  const _topLeftCell = state.topLeftCell;
  const onCellEdited = state.onCellEdited;
  const clearSelection = state.clearSelection;

  const value = updatedData[rowIndex]?.[col.key] ?? data[rowIndex]?.[col.key];
  const _renderedValue = col.valueRenderer?.(value) ?? value;
  let cellContents: ReactNode = _renderedValue;
  const editable = (col.editable ?? state.editable) && !isDeleted;

  let style = col.style ?? {};
  if (isDeleted) {
    style = {
      ...style,
      opacity: 0.5,
      textDecoration: "line-through",
    };
  }

  const focused =
    focusedCell?.col === colIndex && focusedCell?.row === rowIndex;
  // Top left cell of a ranged selection
  const topLeft =
    _topLeftCell?.col === colIndex && _topLeftCell?.row === rowIndex;

  if (!editable && state.editable) {
    // If the cell is not editable but the sheet is editable, we want to differentiate
    // between editable and non-editable cells.
    style.color = "var(--secondary-color)";
  }

  const edited = updatedData[rowIndex]?.[col.key] != null;
  let intent = edited ? "success" : undefined;
  if (isDeleted) {
    intent = "danger";
  } else if (loading) {
    intent = "primary";
  }

  const _Cell = col.cellComponent ?? BaseCell;

  let inlineEditor = editable ? col.inlineEditor ?? true : false;

  if (!topLeft) {
    // This should be the case for every cell except the focused one
    return h(
      _Cell,
      {
        intent,
        loading,
        value,
        style,
        isDeleted,
      },
      cellContents
    );
  }

  // The rest is for the top-left cell of a selection or the focused cell

  if (!editable) {
    // Most cells are not focused and don't need to be editable.
    // This will be the rendering logic for almost all cells

    if (col.dataEditor != null) {
      cellContents = h(EditorPopup, {
        autoFocus: autoFocusEditor,
        content: h(col.dataEditor, {
          value,
        }),
        valueViewer: _renderedValue,
      });
    }

    return h(
      _Cell,
      {
        intent,
        value,
        style,
      },
      [
        h.if(!focused)("input.hidden-input", {
          autoFocus: true,
          onKeyDown(e) {
            if (e.key == "Backspace" || e.key == "Delete") {
              clearSelection();
            }
            e.preventDefault();
          },
        }),
        cellContents,
      ]
    );
    // Could probably put the hidden input elsewhere,
  }

  /* The remaining logic covers cells that are focused and editable */

  const onChange = (e) => {
    if (!editable) return;
    if (value === e.target.value) return;
    onCellEdited(rowIndex, col.key, e.target.value);
  };

  let _inlineEditor: ReactNode = null;
  if (typeof inlineEditor == "boolean") {
    let _value = value;
    if (
      typeof _renderedValue === "string" ||
      typeof _renderedValue === "number" ||
      _renderedValue == null
    ) {
      _value = _renderedValue;
    }
    _inlineEditor = h("input.main-editor", {
      value: _value ?? "",
      autoFocus: autoFocusEditor,
      onChange,
      onKeyDown(e) {
        console.log("Key down in inline editor", e.key);
        if (e.key == "Enter") {
          e.target.blur();
        }

        if (e.key == "Escape") {
          e.target.blur();
          e.preventDefault();
          return;
        }

        const shouldPropagate = handleSpecialKeys(e, e.target);
        if (!shouldPropagate) {
          e.stopPropagation();
        } else {
          e.target.blur();
          //e.target.parentNode.dispatchEvent(new KeyboardEvent("keydown", e));
        }
      },
    });
  } else {
    // If inlineEditor is a ReactNode, we use it directly
    _inlineEditor = inlineEditor as ReactNode;
  }

  let className = null;

  if (col.dataEditor != null) {
    className = "editor-cell";
    cellContents = h([
      h(EditorPopup, {
        autoFocus: autoFocusEditor,
        content: h(col.dataEditor, {
          value,
          onChange(value) {
            if (!editable) return;
            onCellEdited(rowIndex, col.key, value);
          },
        }),
        //inlineEditor: _inlineEditor,
        valueViewer: _renderedValue,
      }),
    ]);
  } else if (_inlineEditor != null) {
    cellContents = _inlineEditor;
    className = "input-cell";
  }

  const isSingleCellSelection = singleFocusedCell(state.selection) != null;

  // Hidden html input
  return h(
    _Cell,
    {
      intent,
      value,
      className,
      style,
      //truncated: false,
    },
    [
      cellContents,
      h.if(editable && isSingleCellSelection)(DragHandle, {
        focusedCell,
      }),
    ]
  );
}

function DragHandle({ focusedCell }) {
  // TODO: we might want to drag multiple columns in some cases
  // This should be on the last cell of a selection
  const onDragValue = useSelector((state) => state.onDragValue);

  return h("div.corner-drag-handle", {
    onMouseDown(e) {
      onDragValue(focusedCell);
      e.preventDefault();
    },
  });
}

function DataSheetEditToolbar({ onSaveData, onDeleteRows }) {
  const selection = useSelector((state) => state.selection);
  const resetChanges = useSelector((state) => state.resetChanges);
  const hasUpdates = useSelector((state) => state.hasUpdates);

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
        "Delete"
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
        "Reset"
      ),
      h.if(onSaveData != null)(
        Button,
        {
          intent: Intent.SUCCESS,
          icon: "floppy-disk",
          disabled: !hasUpdates,
          onClick: onSaveData,
        },
        "Save"
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
      "Scroll to row"
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
    "Add row"
  );
}

export function BaseCell({ children, value, ...rest }) {
  return h(
    Cell,
    {
      interactive: true,
      ...rest,
    },
    children
  );
}

export { Cell };

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
