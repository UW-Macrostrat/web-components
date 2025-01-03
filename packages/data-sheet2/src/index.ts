import {
  Button,
  ButtonGroup,
  HotkeysProvider,
  Intent,
} from "@blueprintjs/core";
import { Cell, Column, Region, Table2 } from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import hyper from "@macrostrat/hyper";
import update from "immutability-helper";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorPopup, handleSpecialKeys } from "./components";
import styles from "./main.module.sass";
import {
  ColumnSpec,
  ColumnSpecOptions,
  DataSheetCoreProps,
  DataSheetProvider,
  topLeftCell,
  useSelector,
} from "./provider";
import { generateColumnSpec, range } from "./utils";

export type { ColumnSpec, ColumnSpecOptions };
export * from "./components";

const h = hyper.styled(styles);

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

interface VisibleCells {
  rowIndexStart: number;
  rowIndexEnd: number;
}

interface DataSheetProps<T> extends DataSheetCoreProps<T> {
  onVisibleCellsChange?: (visibleCells: VisibleCells) => void;
  onSaveData: (updatedData: any[], data: any[]) => void;
  onDeleteRows?: (selection: Region[]) => void;
  verbose?: boolean;
  enableColumnReordering?: boolean;
  onColumnsReordered?: (
    oldIndex: number,
    newIndex: number,
    length: number
  ) => void;
}

export default function DataSheet<T>(props: DataSheetProps<T>) {
  const {
    data,
    columnSpec,
    columnSpecOptions,
    editable = true,
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
        editable,
        ...rest,
      },
      h(_DataSheet, props)
    )
  );
}

function _DataSheet<T>({
  data,
  columnSpec: _columnSpec,
  columnSpecOptions,
  editable = true,
  enableColumnReordering = false,
  onColumnsReordered,
  onVisibleCellsChange,
  onSaveData,
  onDeleteRows,
  verbose = true,
}: DataSheetProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const selection = useSelector<T>((state) => state.selection);
  const setSelection = useSelector((state) => state.setSelection);
  const fillValueBaseCell = useSelector((state) => state.fillValueBaseCell);
  const setFillValueBaseCell = useSelector(
    (state) => state.setFillValueBaseCell
  );

  const _topLeftCell = useMemo(() => topLeftCell(selection), [selection]);
  const focusedCell = useSelector((state) => state.focusedCell);

  const ref = useRef<HTMLDivElement>(null);

  const columnSpec =
    _columnSpec ??
    useMemo(() => {
      // Only build the column spec if it's not provided at the start
      const spec = generateColumnSpec(data, columnSpecOptions);
      return spec;
    }, [data[0], columnSpecOptions]);

  // A sparse array to hold updates
  // TODO: create a "changeset" concept to facilitate undo/redo
  const updatedData = useSelector((state) => state.updatedData);
  const setUpdatedData = useSelector((state) => state.setUpdatedData);

  const hasUpdates = updatedData.length > 0;

  const onCellEdited = useSelector((state) => state.onCellEdited);

  const fillValues = useCallback(
    (fillValueBase, selection) => {
      // Fill values downwards
      if (!editable) return;
      if (fillValueBase == null) return;
      const { col, row } = fillValueBase;
      const key = columnSpec[col].key;
      const value = updatedData[row]?.[key] ?? data[row][key];
      const spec = {};
      for (const region of selection) {
        const { cols, rows } = region;
        for (const row of range(rows)) {
          let op = updatedData[row] == null ? "$set" : "$merge";
          spec[row] = { [op]: { [key]: value } };
        }
      }
      setUpdatedData(update(updatedData, spec));
    },
    [updatedData, columnSpec, editable]
  );

  const clearSelection = useCallback(() => {
    // Delete all selected cells
    let spec = {};
    for (const region of selection) {
      const { cols, rows } = region;
      for (const row of range(rows)) {
        let vals = {};
        for (const col of range(cols)) {
          const key = columnSpec[col].key;
          vals[key] = "";
        }
        let op = updatedData[row] == null ? "$set" : "$merge";
        spec[row] = { [op]: vals };
      }
    }
    setUpdatedData(update(updatedData, spec));
  }, [selection, updatedData, columnSpec]);

  const _onSaveData = useCallback(() => {
    onSaveData(updatedData, data);
    setUpdatedData([]);
  }, [updatedData, data, onSaveData]);

  const visibleCellsRef = useRef<VisibleCells>({
    rowIndexStart: 0,
    rowIndexEnd: 0,
  });

  const _onVisibleCellsChange = useCallback(
    (visibleCells: VisibleCells) => {
      if (
        visibleCells.rowIndexEnd == visibleCellsRef.current.rowIndexEnd &&
        visibleCells.rowIndexStart == visibleCellsRef.current.rowIndexStart
      ) {
        return;
      }

      visibleCellsRef.current = visibleCells;
      onVisibleCellsChange?.(visibleCells);
    },
    [onVisibleCellsChange]
  );

  const onAddRow = useCallback(() => {
    setUpdatedData((updatedData) => {
      const ix = data.length;
      const addRowSpec = { [ix]: { $set: {} } };
      const newUpdatedData = update(updatedData, addRowSpec);
      return newUpdatedData;
    });
  }, [setUpdatedData, data]);

  const _onDeleteRows = useCallback(() => {
    onDeleteRows(selection);
  }, [onDeleteRows, selection]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Updated data", updatedData);
  }, [updatedData]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Selection", selection);
  }, [selection]);

  if (data == null) return null;

  const nDeletionCandidates = getRowsToDelete(selection).length;

  const numRows = Math.max(updatedData.length, data.length);

  return h("div.data-sheet-container", [
    h.if(editable)(DataSheetEditToolbar, {
      hasUpdates,
      setUpdatedData,
      onSaveData: _onSaveData,
      onAddRow,
      onDeleteRows: nDeletionCandidates > 0 ? _onDeleteRows : null,
    }),
    h("div.data-sheet-holder", [
      h(
        Table2,
        {
          ref,
          numRows,
          className: "data-sheet",
          enableFocusedCell: true,
          enableColumnReordering,
          onColumnsReordered,
          focusedCell,
          selectedRegions: selection,
          onSelection(val: Region[]) {
            if (fillValueBaseCell != null) {
              let regions = val.map((region) => {
                const { cols, rows } = region;
                const [col] = cols;
                return { cols: [col, col], rows };
              });
              fillValues(fillValueBaseCell, regions);
              setSelection(regions);
            } else {
              setSelection(val);
            }
          },
          // The cell renderer is memoized internally based on these data dependencies
          cellRendererDependencies: [selection, updatedData, focusedCell, data],
          onVisibleCellsChange: _onVisibleCellsChange,
        },
        columnSpec.map((col, colIndex) => {
          return h(Column, {
            name: col.name,
            cellRenderer: (rowIndex) => {
              return _cellRenderer(
                rowIndex,
                data,
                updatedData,
                col,
                colIndex,
                focusedCell,
                _topLeftCell,
                onCellEdited,
                clearSelection,
                setFillValueBaseCell,
                editable
              );
            },
          });
        })
      ),
    ]),
  ]);
}

function _cellRenderer(
  rowIndex,
  data,
  updatedData,
  col: ColumnSpec,
  colIndex,
  focusedCell,
  _topLeftCell,
  onCellEdited,
  clearSelection,
  setFillValueBaseCell,
  _editable
): any {
  const row = data[rowIndex] ?? updatedData[rowIndex];
  const loading = row == null;

  const value = updatedData[rowIndex]?.[col.key] ?? data[rowIndex]?.[col.key];

  const valueRenderer = col.valueRenderer ?? ((d) => d);

  const autoFocusEditor = true;

  const { style } = col;

  const focused =
    focusedCell?.col === colIndex && focusedCell?.row === rowIndex;
  // Top left cell of a ranged selection
  const topLeft =
    _topLeftCell?.col === colIndex && _topLeftCell?.row === rowIndex;

  const editable = col.editable ?? _editable;

  const edited = updatedData[rowIndex]?.[col.key] != null;
  const intent = edited ? "success" : undefined;

  const _Cell = col.cellComponent ?? BaseCell;

  const _renderedValue = valueRenderer(value);
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
      },
      _renderedValue
    );
  }

  if (!editable) {
    // Most cells are not focused and don't need to be editable.
    // This will be the rendering logic for almost all cells
    return h(_Cell, { intent, value }, [
      h.if(!focused)("input.hidden-input", {
        autoFocus: true,
        onKeyDown(e) {
          if (e.key == "Backspace" || e.key == "Delete") {
            clearSelection();
          }
          e.preventDefault();
        },
      }),
      _renderedValue,
    ]);
    // Could probably put the hidden input elsewhere,
  }

  /* The remaining logic covers cells that are focused and editable */

  const onChange = (e) => {
    if (!editable) return;
    if (value === e.target.value) return;
    onCellEdited(rowIndex, col.key, e.target.value);
  };

  let cellContents = _renderedValue;
  let cellClass = null;

  if (typeof inlineEditor == "boolean") {
    let _value = value;
    if (
      typeof _renderedValue === "string" ||
      typeof _renderedValue === "number" ||
      _renderedValue == null
    ) {
      _value = _renderedValue;
    }
    inlineEditor = h("input", {
      value: _value ?? "",
      autoFocus: autoFocusEditor,
      onChange,
      onKeyDown(e) {
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
          console.log(e.target, e.key);
          if (e.key !== "Escape") {
            e.target.parentNode.dispatchEvent(new KeyboardEvent("keydown", e));
          }
        }
      },
    });
  }

  if (col.dataEditor != null) {
    cellClass = "editor-cell";
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
        inlineEditor,
        valueViewer: _renderedValue,
      }),
    ]);
  } else if (inlineEditor != null) {
    cellContents = inlineEditor;
    cellClass = "input-cell";
  }

  // Hidden html input
  return h(
    _Cell,
    {
      intent,
      value,
      className: cellClass,
      style,
      //truncated: false,
    },
    [
      cellContents,
      h.if(editable)(DragHandle, { setFillValueBaseCell, focusedCell }),
    ]
  );
}

function DragHandle({ setFillValueBaseCell, focusedCell }) {
  // TODO: we might want to drag multiple columns in some cases
  // This should be on the last cell of a selection
  return h("div.corner-drag-handle", {
    onMouseDown(e) {
      setFillValueBaseCell(focusedCell);
      e.preventDefault();
    },
  });
}

function DataSheetEditToolbar({
  hasUpdates,
  setUpdatedData,
  onSaveData,
  onAddRow,
  onDeleteRows,
}) {
  return h("div.data-sheet-toolbar", [
    h(ButtonGroup, { minimal: true }, [
      h.if(onAddRow != null)(AddRowButton, { onAddRow }),
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
          onClick() {
            setUpdatedData([]);
          },
        },
        "Reset"
      ),
      h(
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

function AddRowButton({ onAddRow }) {
  return h(
    Button,
    {
      icon: "plus",
      onClick: onAddRow,
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
