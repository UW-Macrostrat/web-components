import { ColumnSpec, editorKeyHandlerAtom } from "./utils";
import { DataSheetStore, TableElementStatus } from "./types.ts";
import h from "./main.module.sass";
import { ReactNode } from "react";
import { EditorPopup } from "./components";
import { singleFocusedCell } from "./zustand-store.ts";
import { Cell } from "@blueprintjs/table";
import { ctx, useSelector } from "./provider.ts";

export function basicCellRenderer<T>(
  rowIndex: number,
  colIndex: number,
  columnSpec: ColumnSpec,
  state: DataSheetStore<T>,
  autoFocusEditor = true,
  filteredRowIndices?: number[] | null,
): any {
  // When filters are active, `rowIndex` is the visible row position.
  // Map it to the actual data index for data access.
  const dataRowIndex =
    filteredRowIndices != null
      ? (filteredRowIndices[rowIndex] ?? rowIndex)
      : rowIndex;

  const data = state.data;
  const updatedData = state.updatedData;

  const isDeleted = state.rowStatus[dataRowIndex] == TableElementStatus.DELETED;

  const row = data[dataRowIndex] ?? updatedData[dataRowIndex];
  const loading = row == null;
  const col = columnSpec;

  const _topLeftCell = state.topLeftCell;
  const onCellEdited = state.onCellEdited;

  const value: T | undefined =
    updatedData[dataRowIndex]?.[col.key] ?? data[dataRowIndex]?.[col.key];
  const isEmpty = value == null || value === "";
  const _renderedValue = isEmpty ? null : (col.valueRenderer?.(value) ?? value);

  let style = col.style ?? {};

  if (isDeleted) {
    style.opacity = 0.5;
    style.textDecoration = "line-through";
  }

  const editable = (col.editable ?? state.editable) && !isDeleted;

  // topLeftCell stores visible row indices, so compare with the visible rowIndex
  const topLeft =
    _topLeftCell?.col === colIndex && _topLeftCell?.row === rowIndex;

  const tableIsEditable = state.editable;

  const edited =
    updatedData[dataRowIndex]?.[col.key] != null ||
    state.rowStatus[dataRowIndex] === TableElementStatus.ADDED;
  let intent = edited ? "success" : undefined;
  if (isDeleted) {
    intent = "danger";
  }

  const _Cell = col.cellComponent ?? Cell;

  let inlineEditor = editable ? (col.inlineEditor ?? true) : false;

  if (!topLeft) {
    return h(
      _Cell,
      {
        intent,
        loading,
        value,
        style,
        disabled: tableIsEditable && !editable,
        interactive: false,
      },
      _renderedValue,
    );
  }

  // The rest is for the top-left cell of a selection or the focused cell

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
          isEdited: edited,
          onChange(value) {
            if (!editable) return;
            state.onSelectionEdited(value);
          },
          resetValue() {
            state.resetChanges();
          },
        }),
      ],
    );
  }

  if (!editable) {
    if (_dataEditor != null) {
      cellContents = _dataEditor;
    }
    const className = "value-viewer-cell";

    return h(
      _Cell,
      {
        intent,
        value,
        style,
        className,
        interactive: false,
      },
      cellContents,
    );
  }

  /* The remaining logic covers cells that are focused and editable */

  const onChange = (e) => {
    if (!editable) return;
    if (value === e.target.value) return;
    // Use dataRowIndex for the actual data mutation
    onCellEdited(dataRowIndex, col.key, e.target.value);
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
    _inlineEditor = h(EditorInput, {
      className: "main-editor",
      value: _value ?? "",
      autoFocus: autoFocusEditor,
      onChange,
    });
  } else {
    // If inlineEditor is a ReactNode, we use it directly
    _inlineEditor = inlineEditor as ReactNode;
  }

  let hiddenInput: React.ReactNode = h(EditorInput, {
    className: "hidden-input",
    autoFocus: true,
  });

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
      interactive: true,
      //truncated: false,
    },
    [
      cellContents,
      h.if(editable && isSingleCellSelection)(DragHandle),
      hiddenInput,
    ],
  );
}

function EditorInput(props) {
  const onKeyDown = ctx.useValue(editorKeyHandlerAtom);
  return h("input", {
    onKeyDown,
    ...props,
  });
}

function DragHandle() {
  // TODO: we might want to drag multiple columns in some cases
  // This should be on the last cell of a selection
  const onMouseDown = useSelector((state) => state.onDragValue);
  return h("div.corner-drag-handle", { onMouseDown });
}
