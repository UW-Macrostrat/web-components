import { Button, ButtonGroup, Intent } from "@blueprintjs/core";
import {
  Cell,
  Column,
  FocusedCellCoordinates,
  Region,
  Table2,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import hyper from "@macrostrat/hyper";
import update from "immutability-helper";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorPopup } from "./components";
import styles from "./main.module.sass";

export * from "./components";

const h = hyper.styled(styles);

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

interface DataSheetProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  columnSpecOptions?: ColumnSpecOptions;
  editable?: boolean;
  onVisibleCellsChange?: (visibleCells: Region[]) => void;
}

export default function DataSheet<T>({
  data,
  columnSpec: _columnSpec,
  columnSpecOptions,
  editable = true,
  onVisibleCellsChange,
}: DataSheetProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const [selection, setSelection] = useState<Region[]>([]);
  const _topLeftCell = useMemo(() => topLeftCell(selection), [selection]);
  const focusedCell = useMemo(() => singleFocusedCell(selection), [selection]);
  const [fillValueBaseCell, setFillValueBaseCell] =
    useState<FocusedCellCoordinates>(null);

  useEffect(() => {
    // Cancel value filling if we change the selection
    if (focusedCell != null) {
      setFillValueBaseCell(null);
    }
  }, [focusedCell]);

  const ref = useRef<HTMLDivElement>(null);

  const columnSpec =
    _columnSpec ??
    useMemo(() => {
      // Only build the column spec if it's not provided at the start
      const spec = generateColumnSpec(data, columnSpecOptions);
      console.log("Generating column spec", data, spec);
      return spec;
    }, [data[0], columnSpecOptions]);

  // A sparse array to hold updates
  // TODO: create a "changeset" concept to facilitate undo/redo
  const [updatedData, setUpdatedData] = useState([]);
  const hasUpdates = updatedData.length > 0;

  const onCellEdited = useCallback(
    (row: number, key: string, value: any) => {
      if (!editable) return;
      let rowSpec = {};
      if (value != null) {
        const rowOp = updatedData[row] != null ? "$merge" : "$set";
        rowSpec = { [rowOp]: { [key]: value } };
      } else {
        rowSpec = { $unset: [key] };
      }
      const spec = { [row]: rowSpec };
      setUpdatedData(update(updatedData, spec));
    },
    [setUpdatedData, updatedData, editable]
  );

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

  if (data == null) return null;

  return h("div.data-sheet-container", [
    h.if(editable)(DataSheetEditToolbar, { hasUpdates, setUpdatedData }),
    h("div.data-sheet-holder", [
      h(
        Table2,
        {
          ref,
          numRows: data.length,
          className: "data-sheet",
          enableFocusedCell: true,
          focusedCell,
          selectedRegions: selection,
          onSelection(val: Region[]) {
            if (fillValueBaseCell != null) {
              let regions = val.map((region) => {
                const { cols, rows } = region;
                const [col] = cols;
                return { cols: <[number, number]>[col, col], rows };
              });
              fillValues(fillValueBaseCell, regions);
              setSelection(regions);
            } else {
              setSelection(val);
            }
          },
          // The cell renderer is memoized internally based on these data dependencies
          cellRendererDependencies: [selection, updatedData, focusedCell, data],
          onVisibleCellsChange,
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
  const row = data[rowIndex];
  const loading = row == null;

  const value = updatedData[rowIndex]?.[col.key] ?? data[rowIndex]?.[col.key];

  const valueRenderer = col.valueRenderer ?? ((d) => d);

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
  const inlineEditor = col.inlineEditor ?? true;

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

  if (!focused) {
    // Most cells are not focused and don't need to be editable.
    // This will be the rendering logic for almost all cells
    return h(_Cell, { intent, value }, [
      h("input.hidden-input", {
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
    const value = e.target.value;
    onCellEdited(rowIndex, col.key, value);
  };

  let cellContents = _renderedValue;
  let cellClass = null;

  if (col.dataEditor != null) {
    cellClass = "editor-cell";
    cellContents = h([
      h(EditorPopup, {
        content: h(col.dataEditor, {
          value,
          onChange(value) {
            if (!editable) return;
            onCellEdited(rowIndex, col.key, value);
          },
        }),
      }),
      _renderedValue,
    ]);
  } else if (inlineEditor != false) {
    cellClass = "input-cell";
    let _value = value;
    if (
      typeof _renderedValue === "string" ||
      typeof _renderedValue === "number" ||
      _renderedValue == null
    ) {
      _value = _renderedValue;
    }
    cellContents = h("input", {
      value: _value,
      autoFocus: true,
      onChange,
    });
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

function DataSheetEditToolbar({ hasUpdates, setUpdatedData }) {
  return h("div.data-sheet-toolbar", [
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
          onClick() {
            console.log("Here is where we would save data");
          },
        },
        "Save"
      ),
    ]),
  ]);
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

function range(arr: number[]) {
  if (arr.length != 2) throw new Error("Range must have two elements");
  const [start, end] = arr;
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

const defaultRenderers = {
  string: (d) => d,
  number: (d) => d?.toFixed(2),
  boolean: (d) => (d ? "T" : "F"),
  object: (d) => JSON.stringify(d),
  integer: (d) => d?.toFixed(0),
  array: (d) => d?.join(", "),
};

function generateDefaultColumnSpec<T>(data: Array<T>): ColumnSpec[] {
  /** Build a default column spec from a dataset based on the first n rows */
  if (data == null) return [];
  // Get the keys
  const keys = new Set();
  const types = new Map();
  for (const row of data) {
    if (row == null) continue;
    for (const key of Object.keys(row)) {
      const val = row[key];
      keys.add(key);

      if (val == null) continue;
      let type: string = typeof val;
      // Special 'type' for integers
      if (Number.isInteger(val)) {
        type = "integer";
      }

      // Special 'type' for arrays of simple values
      if (
        Array.isArray(val) &&
        val.every((d) => typeof d === "string" || typeof d === "number")
      ) {
        type = "array";
      }

      if (types.has(key)) {
        if (types.get(key) !== type) {
          if (type === "number" && types.get(key) === "integer") {
            types.set(key, "number");
          }
          if (type === "object" && types.get(key) === "array") {
            types.set(key, "object");
          }

          types.set(key, "string");
        }
      } else {
        types.set(key, type);
      }
    }
  }

  // Build a column spec
  const spec = [];
  for (const key of keys) {
    spec.push({
      name: key,
      key,
      valueRenderer: defaultRenderers[types.get(key)],
    });
  }
  return spec;
}

export { Cell };

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
  inlineEditor?: boolean;
  style?: React.CSSProperties;
}

export interface ColumnSpecOptions {
  overrides: Record<string, Partial<ColumnSpec> | string>;
  data?: any[]; // Data to use for type inference
  nRows?: number; // Number of rows to use for type inference
  omitColumns?: string[]; // Columns to omit. Takes precedence over includeColumns.
  includeColumns?: string[]; // Columns to include.
}

function generateColumnSpec<T>(
  data: T[],
  options: ColumnSpecOptions
): ColumnSpec[] {
  /** Generate a column spec from a dataset */
  const { overrides = {}, nRows = 10, omitColumns, includeColumns } = options;

  if (data == null) return [];

  const _nRows = Math.min(nRows, data.length);

  let columnSpec = generateDefaultColumnSpec(data.slice(0, _nRows));
  let filteredSpec = columnSpec.filter((col) => {
    if (omitColumns != null && omitColumns.includes(col.key)) {
      return false;
    }
    if (includeColumns != null && !includeColumns.includes(col.key)) {
      return false;
    }
    return true;
  });

  // Apply overrides
  return filteredSpec.map((col) => {
    let ovr = overrides[col.key];
    if (ovr == null) return col;
    if (typeof ovr === "string") {
      return { ...col, name: ovr };
    }
    return { ...col, ...ovr };
  });
}

function topLeftCell(
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
