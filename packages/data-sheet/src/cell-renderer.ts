import {
  ColumnSpec,
  CellRenderContext,
  CellDetailContext,
  editorKeyHandlerAtom,
  validateCell,
} from "./utils";
import { DataSheetStore, TableElementStatus } from "./types.ts";
import h from "./main.module.sass";
import { ReactNode, useEffect, useRef, useState } from "react";
import { EditorPopup, CellDetailModal } from "./components";
import { singleFocusedCell } from "./zustand-store.ts";
import { Cell } from "@blueprintjs/table";
import { ctx, useSelector } from "./provider.ts";

export function basicCellRenderer<T>(
  rowIndex: number,
  colIndex: number,
  columnSpec: ColumnSpec,
  state: DataSheetStore<T>,
  filteredRowIndices?: number[] | null,
): any {
  // Auto-activation is on when the mode is "auto" and it hasn't been suppressed
  // (Escape enters navigation mode until the next click).
  // Whether the inline editor grabs focus. It follows the store-owned surface
  // open state, so it focuses on selection in auto mode and on click in manual
  // mode, and not at all in navigation mode. The popover surfaces read the
  // same state directly.
  const focusOnOpen = state.cellSurfaceOpen;
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

  const edited =
    updatedData[dataRowIndex]?.[col.key] != null ||
    state.rowStatus[dataRowIndex] === TableElementStatus.ADDED;

  // Validate the cell (skipped for deleted rows). Orthogonal to edit status.
  const validation = isDeleted ? null : validateCell(col, value, row, dataRowIndex);

  // Context passed to custom renderers so they can render based on the
  // row/column position and cell status (and, with the editing API, write
  // edits back). `rowIndex` is the data-row index, stable under sort/filter.
  const cellContext: CellRenderContext<T> = {
    value,
    rowIndex: dataRowIndex,
    colIndex,
    column: col,
    row,
    isEdited: edited,
    isDeleted,
    validation,
  };

  const _renderedValue = isEmpty
    ? null
    : (col.valueRenderer?.(value, cellContext) ?? value);

  // Clone so we never mutate the caller's column-spec style object
  let style = { ...(col.style ?? {}) };

  if (isDeleted) {
    style.opacity = 0.5;
    style.textDecoration = "line-through";
  }

  const editable = (col.editable ?? state.editable) && !isDeleted;

  // topLeftCell stores visible row indices, so compare with the visible rowIndex
  const topLeft =
    _topLeftCell?.col === colIndex && _topLeftCell?.row === rowIndex;

  const tableIsEditable = state.editable;

  // Intent precedence: error > warning > deleted > edited. Validation state
  // overrides the edited-green so an edited-but-invalid cell reads as invalid.
  let intent: string | undefined;
  if (validation?.severity === "error") {
    intent = "danger";
  } else if (validation?.severity === "warning") {
    intent = "warning";
  } else if (isDeleted) {
    intent = "danger";
  } else if (edited) {
    intent = "success";
  }

  const _Cell = col.cellComponent ?? Cell;

  // Only forward the render context to a custom cell component; the default
  // Blueprint Cell would spread unknown props onto the DOM.
  const cellComponentProps =
    col.cellComponent != null ? { cellContext } : {};

  // Allow a column to pick the editor per-cell (e.g. textarea only when the
  // value is long). A returned key overrides the static column field even
  // when its value is false/null, so use `in` rather than nullish-coalesce.
  const perCellEditors = col.editorForCell?.(cellContext);
  const dataEditorSpec =
    perCellEditors != null && "dataEditor" in perCellEditors
      ? perCellEditors.dataEditor
      : col.dataEditor;
  const inlineEditorSpec =
    perCellEditors != null && "inlineEditor" in perCellEditors
      ? perCellEditors.inlineEditor
      : col.inlineEditor;

  let inlineEditor = editable ? (inlineEditorSpec ?? true) : false;

  // Build the detail context for the unified `cellDetail` surface.
  const makeDetailCtx = (editableFlag: boolean): CellDetailContext<T> => ({
    ...cellContext,
    editable: editableFlag,
    onChange(v: any) {
      if (editableFlag) onCellEdited(dataRowIndex, col.key, v);
    },
    resetValue() {
      state.resetChanges();
    },
    close() {
      state.closeCellSurface();
      state.tableElement?.focus?.();
    },
  });
  const detailPresentation =
    col.cellDetail != null ? (col.detailPresentation ?? "popover") : null;

  if (!topLeft) {
    // An inline surface is a persistent in-cell renderer, so it draws on every
    // cell (read-only when not the focused/editing cell).
    if (detailPresentation === "inline") {
      return h(
        _Cell,
        {
          intent,
          value,
          style,
          className: "value-viewer-cell",
          interactive: false,
          ...cellComponentProps,
        },
        col.cellDetail!(makeDetailCtx(false)),
      );
    }
    return h(
      _Cell,
      {
        intent,
        loading,
        value,
        style,
        disabled: tableIsEditable && !editable,
        interactive: false,
        ...cellComponentProps,
      },
      _renderedValue,
    );
  }

  // The rest is for the top-left cell of a selection or the focused cell

  // Unified cell surface: one renderer that acts as editor (when editable) or
  // viewer (otherwise), presented as a popover / modal / inline. Supersedes
  // dataEditor / detailRenderer / editorForCell.
  if (col.cellDetail != null) {
    const content = col.cellDetail(makeDetailCtx(editable));

    if (detailPresentation === "inline") {
      // Persistent in-cell surface (editable on the focused cell). No popover.
      return h(
        _Cell,
        {
          intent,
          value,
          style,
          className: editable ? "input-cell" : "value-viewer-cell",
          interactive: editable,
          ...cellComponentProps,
        },
        content,
      );
    }

    if (detailPresentation === "modal") {
      // CellDetailModal subscribes to the store so the dialog closes reactively.
      return h(
        _Cell,
        {
          intent,
          value,
          style,
          className: "value-viewer-cell",
          interactive: false,
          ...cellComponentProps,
        },
        h(
          CellDetailModal,
          { title: col.name, valueViewer: _renderedValue },
          content,
        ),
      );
    }

    // Default: popover (same open/close machinery as editors and panels).
    const panel = h(EditorPopup, { valueViewer: _renderedValue }, content);
    return h(
      _Cell,
      {
        intent,
        value,
        style,
        className: "editor-cell",
        interactive: editable,
        ...cellComponentProps,
      },
      panel,
    );
  }

  // Read-only detail panel: a surface that opens on selection (auto) or click,
  // shows arbitrary content, and never takes keyboard focus — so arrow keys
  // keep navigating the table. Uses the same open/close machinery as editors.
  if (col.detailRenderer != null) {
    const panel = h(
      EditorPopup,
      { valueViewer: _renderedValue },
      col.detailRenderer(cellContext),
    );
    return h(
      _Cell,
      {
        intent,
        value,
        style,
        // Use the editor-cell popover layout so the target fills the cell
        // without the double-padding offset of `value-viewer-cell`.
        className: "editor-cell",
        interactive: false,
        ...cellComponentProps,
      },
      panel,
    );
  }

  let cellContents: ReactNode = _renderedValue;

  let _dataEditor = null;
  let className = null;

  if (dataEditorSpec != null) {
    _dataEditor = h(
      EditorPopup,
      {
        valueViewer: _renderedValue,
      },
      [
        h(dataEditorSpec, {
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
        ...cellComponentProps,
      },
      cellContents,
    );
  }

  /* The remaining logic covers cells that are focused and editable */

  const onChange = (e) => {
    if (!editable) return;
    if (_renderedValue === e.target.value) return;
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
      autoFocus: focusOnOpen,
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
      ...cellComponentProps,
      //truncated: false,
    },
    [
      cellContents,
      h.if(editable && isSingleCellSelection)(DragHandle),
      //hiddenInput,
    ],
  );
}

function EditorInput(props) {
  const { value, onChange, ...rest } = props;
  const onKeyDown = ctx.useValue(editorKeyHandlerAtom);
  const navDirection = useSelector((s) => s.lastNavDirection);
  const surfaceOpen = useSelector((s) => s.cellSurfaceOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const [_value, setValue] = useState(value);
  useEffect(() => {
    setValue(value);
  }, [value]);
  useEffect(() => {
    // Focus when the cell's surface is open (on mount, and when reopened via
    // click/F2 while already mounted), placing the cursor on the side we're
    // travelling toward so another arrow in that direction leaves the cell.
    const el = inputRef.current;
    if (el == null || !surfaceOpen) return;
    el.focus();
    const atStart = navDirection === "up" || navDirection === "left";
    const pos = atStart ? 0 : (el.value?.length ?? 0);
    el.setSelectionRange(pos, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceOpen]);
  return h("input", {
    ref: inputRef,
    onKeyDown,
    onBlur: onChange,
    value: _value ?? value,
    onChange: (e) => setValue(e.target.value),
    ...rest,
  });
}

function DragHandle() {
  // TODO: we might want to drag multiple columns in some cases
  // This should be on the last cell of a selection
  const onMouseDown = useSelector((state) => state.onDragValue);
  return h("div.corner-drag-handle", { onMouseDown });
}
