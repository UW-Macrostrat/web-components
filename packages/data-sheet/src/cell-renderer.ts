import { ColumnSpec } from "./utils";
import { DataSheetStore } from "./types.ts";
import h from "./main.module.sass";
import { ReactNode } from "react";
import { EditorPopup } from "./components";
import { singleFocusedCell } from "./zustand-store.ts";
import { Cell } from "@blueprintjs/table";
import { useSelector } from "./provider.ts";

export function basicCellRenderer<T>(
  rowIndex: number,
  colIndex: number,
  columnSpec: ColumnSpec,
  state: DataSheetStore<T>,
  autoFocusEditor = true,
): any {
  const data = state.data;
  const updatedData = state.updatedData;

  const isDeleted = state.deletedRows.has(rowIndex);

  const row = data[rowIndex] ?? updatedData[rowIndex];
  const loading = row == null;
  const col = columnSpec;

  const _topLeftCell = state.topLeftCell;
  const onCellEdited = state.onCellEdited;

  const value = updatedData[rowIndex]?.[col.key] ?? data[rowIndex]?.[col.key];
  const _renderedValue = col.valueRenderer?.(value) ?? value;

  let style = col.style ?? {};
  if (isDeleted) {
    style = {
      ...style,
      opacity: 0.5,
      textDecoration: "line-through",
    };
  }

  //const focused =
  //  focusedCell?.col === colIndex && focusedCell?.row === rowIndex;

  const editable = (col.editable ?? state.editable) && !isDeleted;

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
  }

  const _Cell = col.cellComponent ?? BaseCell;

  let inlineEditor = editable ? (col.inlineEditor ?? true) : false;

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
      _renderedValue,
    );
  }

  // The rest is for the top-left cell of a selection or the focused cell

  // Hidden input to capture key events
  let hiddenInput = h("input.hidden-input", {
    autoFocus: true,
    onKeyDown: state.editorKeyHandler,
  });

  let cellContents: ReactNode = _renderedValue;

  let _dataEditor = null;
  let className = null;

  if (col.dataEditor != null) {
    _dataEditor = h(
      EditorPopup,
      {
        autoFocus: autoFocusEditor,
        valueViewer: _renderedValue,
      },
      [
        h(col.dataEditor, {
          value,
          editable,
          onChange(value) {
            if (!editable) return;
            state.onSelectionEdited(value);
          },
        }),
      ],
    );
  }

  if (!editable) {
    // Most cells are not focused and don't need to be editable.
    // This will be the rendering logic for almost all cells

    if (_dataEditor != null) {
      cellContents = _dataEditor;
    }

    return h(
      _Cell,
      {
        intent,
        value,
        style,
      },
      cellContents,
    );
    // Could probably put the hidden input elsewhere,
  }

  /* The remaining logic covers cells that are focused and editable */

  const onChange = (e) => {
    if (!editable) return;
    if (value === e.target.value) return;
    onCellEdited(rowIndex, col.key, e.target.value);
  };

  const isSingleCellSelection = singleFocusedCell(state.selection) != null;

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
      onKeyDown: state.editorKeyHandler,
    });
  } else {
    // If inlineEditor is a ReactNode, we use it directly
    _inlineEditor = inlineEditor as ReactNode;
  }

  if (_dataEditor != null) {
    className = "editor-cell";
    cellContents = _dataEditor;
    hiddenInput = null;
  } else if (_inlineEditor != null) {
    cellContents = _inlineEditor;
    className = "input-cell";
    hiddenInput = null;
  }

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
      h.if(editable && isSingleCellSelection)(DragHandle),
      hiddenInput,
    ],
  );
}

function DragHandle() {
  // TODO: we might want to drag multiple columns in some cases
  // This should be on the last cell of a selection
  const onMouseDown = useSelector((state) => state.onDragValue);
  return h("div.corner-drag-handle", { onMouseDown });
}

export function BaseCell({ children, value, ...rest }) {
  return h(
    Cell,
    {
      interactive: true,
      ...rest,
    },
    children,
  );
}
