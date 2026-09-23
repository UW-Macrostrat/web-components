/**
 * Row editor — one row's fields as a form, derived from the column spec.
 *
 * The row-level mirror of the cell viewer/editor split: every column becomes a
 * field whose label is the column's `name`, whose value is drawn by the
 * column's `valueRenderer`, and whose editor is the column's `cellDetail` when
 * it has one, else an input chosen from `dataType`. What may be written is the
 * same rule the grid applies (`isColumnWritable`): a locked or derived column
 * shows as read-only, and the form is read-only as a whole when `editable` is
 * off — a read-only "row viewer" and an editable "row editor" are one surface
 * in two modes.
 *
 * `RowEditor` knows nothing about the sheet's store: it takes a row, an edit
 * overlay for it, and an `onChange`, so a consumer can mount it beside a table,
 * in a dialog, or on a page where the table isn't rendered at all.
 * `SelectedRowEditor` binds it to a `DataSheetProvider`'s store — the selected
 * row, the edit overlay, the `editable` flag — and writes through
 * `onCellEdited`, so edits land in the same overlay and the same `onEdit`
 * stream as typing into the grid.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import {
  Button,
  FormGroup,
  InputGroup,
  Intent,
  Switch,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  type CellDetailContext,
  type CellValidation,
  type ColumnSpec,
  isColumnWritable,
  useSelector,
  useStoreAPI,
} from "../provider";
import { getSelectedRowIndices } from "../actions/selection.ts";
import { validateCell } from "../utils/validation.ts";
import styles from "./row-editor.module.sass";

const h = hyper.styled(styles);

export interface RowEditorProps<T = any> {
  /** The columns to show, in order. Hidden columns are left out unless
   * `showHidden` is set; derived and locked columns show read-only. */
  columnSpec: ColumnSpec[];
  /** The row as loaded (the base values). */
  row: T | null | undefined;
  /** The pending edits to this row, laid over `row` for display. A field
   * present here is marked as edited. */
  edits?: Partial<T> | null;
  /** Whether the form takes edits at all. Off, it is a row *viewer*. */
  editable?: boolean;
  /** The row's data index, handed to `validate` and `cellDetail`. */
  rowIndex?: number;
  /** A field was changed. Absent, the form is read-only. */
  onChange?: (columnKey: string, value: any) => void;
  /** Revert one field to its base value. Absent, edited fields have no
   * revert affordance. */
  onResetField?: (columnKey: string) => void;
  /** Also show the columns the spec hides (read-only). */
  showHidden?: boolean;
  /** Leave out fields with no value — a compact read-only view. Editable
   * fields always show, so there is somewhere to type. */
  hideEmpty?: boolean;
  /** Labels beside values rather than above them. */
  inline?: boolean;
  className?: string;
  /** Rendered above the fields (a title row, say). */
  header?: ReactNode;
  children?: ReactNode;
}

export function RowEditor<T = any>(props: RowEditorProps<T>) {
  const {
    columnSpec,
    row,
    edits,
    editable = true,
    rowIndex = -1,
    onChange,
    onResetField,
    showHidden = false,
    hideEmpty = false,
    inline = false,
    className,
    header,
    children,
  } = props;

  const merged = useMemo(
    () => ({ ...(row ?? {}), ...(edits ?? {}) }) as any,
    [row, edits],
  );

  const columns = useMemo(
    () => columnSpec.filter((col) => showHidden || !col.hidden),
    [columnSpec, showHidden],
  );

  const canEdit = editable && onChange != null;

  const fields = columns.map((col, colIndex) => {
    const value = merged[col.key];
    const writable = canEdit && isColumnWritable(col, true);
    const isEmpty = value == null || value === "";
    if (hideEmpty && isEmpty && !writable) return null;
    const isEdited = edits != null && col.key in edits;
    const validation = validateCell(col, value, merged, rowIndex);
    const ctx: CellDetailContext = {
      value,
      rowIndex,
      colIndex,
      column: col,
      row: merged,
      isEdited,
      isDeleted: false,
      status: undefined,
      validation,
      editable: writable,
      onChange(next) {
        if (!writable) return;
        onChange?.(col.key, next);
      },
      resetValue() {
        onResetField?.(col.key);
      },
      close() {},
    };
    return h(RowEditorField, {
      key: col.key,
      ctx,
      inline,
      onReset: isEdited && onResetField != null ? ctx.resetValue : null,
    });
  });

  return h(
    "div.row-editor",
    { className: classNames(className, { editable: canEdit, inline }) },
    [header, h("div.row-editor-fields", fields), children],
  );
}

/* ------------------------------------------------------------------ field */

interface RowEditorFieldProps {
  ctx: CellDetailContext;
  inline?: boolean;
  onReset?: (() => void) | null;
}

/** One field: the column's name, a marker for what kind of value it is, the
 * value or its editor, and any validation message. */
export function RowEditorField({ ctx, inline, onReset }: RowEditorFieldProps) {
  const { column: col, validation, isEdited, editable } = ctx;

  let intent: Intent | undefined;
  if (validation?.severity === "error") {
    intent = "danger";
  } else if (validation?.severity === "warning") {
    intent = "warning";
  }

  let marker: ReactNode = null;
  if (col.derived) {
    marker = h(
      Tag,
      {
        minimal: true,
        icon: "function",
        className: "field-marker",
        title: "Derived — computed from other values",
      },
      "derived",
    );
  } else if (col.required && editable) {
    marker = h("span.required-marker", { title: "Required" }, "*");
  }

  let reset: ReactNode = null;
  if (onReset != null) {
    reset = h(Button, {
      icon: "undo",
      minimal: true,
      small: true,
      className: "reset-field",
      title: "Revert to the loaded value",
      onClick: onReset,
    });
  }

  const label = h("span.field-label", [
    h("span.field-name", col.name),
    marker,
    reset,
  ]);

  return h(
    FormGroup,
    {
      label,
      inline,
      intent,
      helperText: validation?.message,
      className: classNames("row-editor-field", {
        edited: isEdited,
        derived: col.derived,
        "read-only": !editable,
        [`data-type-${col.dataType ?? "string"}`]: true,
      }),
    },
    h(FieldSurface, { ctx }),
  );
}

/** The value or its editor: the column's own `cellDetail` when it has one
 * (the unified surface, which is an editor when `ctx.editable`), else a
 * default by `dataType`. */
function FieldSurface({ ctx }: { ctx: CellDetailContext }) {
  const { column: col, editable } = ctx;
  if (col.cellDetail != null) {
    return h("div.field-surface.cell-detail", col.cellDetail(ctx));
  }
  if (!editable) {
    return h(FieldValue, { ctx });
  }
  return h(DefaultFieldEditor, { ctx });
}

/** The read-only rendering of a value, through the column's renderer. */
export function FieldValue({ ctx }: { ctx: CellDetailContext }) {
  const { value, column: col } = ctx;
  if (value == null || value === "") {
    return h("span.field-value.empty", "—");
  }
  const rendered = col.valueRenderer?.(value, ctx) ?? String(value);
  return h("span.field-value", rendered);
}

function DefaultFieldEditor({ ctx }: { ctx: CellDetailContext }) {
  const { value, column: col, onChange } = ctx;
  const type = col.dataType ?? "string";

  if (type === "boolean") {
    return h(Switch, {
      checked: Boolean(value),
      onChange: (evt: any) => onChange(evt.target.checked),
      className: "field-switch",
    });
  }
  if (type === "text") {
    return h(CommittedTextArea, { value, onCommit: onChange });
  }
  if (type === "number" || type === "integer") {
    return h(CommittedInput, {
      value,
      onCommit: (text: string) => onChange(parseNumber(text, type)),
      type: "number",
      step: type === "integer" ? 1 : "any",
    });
  }
  if (type === "object" || type === "array") {
    // No default editor for structured values: the column should supply a
    // `cellDetail`. Show the value so the form is still complete.
    return h(FieldValue, { ctx });
  }
  return h(CommittedInput, { value, onCommit: onChange });
}

function parseNumber(text: string, type: "number" | "integer") {
  if (text === "" || text == null) return null;
  const n = type === "integer" ? parseInt(text, 10) : parseFloat(text);
  if (isNaN(n)) return text;
  return n;
}

/** An input that commits on blur or Enter rather than on every keystroke, the
 * way a sheet cell does — so a half-typed number doesn't move a column. */
function CommittedInput({
  value,
  onCommit,
  ...rest
}: {
  value: any;
  onCommit: (text: string) => void;
  [key: string]: any;
}) {
  const [text, setText] = useState(toText(value));
  useEffect(() => {
    setText(toText(value));
  }, [value]);
  const commit = () => {
    if (text === toText(value)) return;
    onCommit(text);
  };
  return h(InputGroup, {
    small: true,
    fill: true,
    value: text,
    onValueChange: setText,
    onBlur: commit,
    onKeyDown(evt) {
      if (evt.key === "Enter") commit();
      if (evt.key === "Escape") setText(toText(value));
    },
    ...rest,
  });
}

function CommittedTextArea({
  value,
  onCommit,
}: {
  value: any;
  onCommit: (text: string) => void;
}) {
  const [text, setText] = useState(toText(value));
  useEffect(() => {
    setText(toText(value));
  }, [value]);
  return h(TextArea, {
    small: true,
    fill: true,
    autoResize: true,
    value: text,
    onChange: (evt: any) => setText(evt.target.value),
    onBlur() {
      if (text === toText(value)) return;
      onCommit(text);
    },
  });
}

function toText(value: any): string {
  if (value == null) return "";
  return String(value);
}

/* ---------------------------------------------------------- store-bound */

export interface SelectedRow<T = any> {
  rowIndex: number | null;
  row: T | null;
  edits: Partial<T> | null;
  isDeleted: boolean;
}

/** The row the sheet's selection addresses — the first selected row — with
 * its edit overlay. `rowIndex` is `null` when nothing is selected. Must be
 * read inside a `DataSheetProvider`. */
export function useSelectedRow<T = any>(): SelectedRow<T> {
  const selection = useSelector((s) => s.selection);
  const data = useSelector((s) => s.data);
  const updatedData = useSelector((s) => s.updatedData);
  const rowStatus = useSelector((s) => s.rowStatus);
  const filteredRowIndices = useSelector((s) => s.filteredRowIndices);

  return useMemo(() => {
    const rowIndex =
      getSelectedRowIndices(selection ?? [], filteredRowIndices)[0] ?? null;
    if (rowIndex == null) {
      return { rowIndex: null, row: null, edits: null, isDeleted: false };
    }
    return {
      rowIndex,
      row: (data?.[rowIndex] ?? null) as T | null,
      edits: (updatedData?.[rowIndex] ?? null) as Partial<T> | null,
      isDeleted: rowStatus?.[rowIndex] === "deleted",
    };
  }, [selection, data, updatedData, rowStatus, filteredRowIndices]);
}

export interface SelectedRowEditorProps extends Omit<
  RowEditorProps,
  "columnSpec" | "row" | "edits" | "onChange" | "onResetField" | "rowIndex"
> {
  /** Shown when no row is selected. */
  emptyState?: ReactNode;
}

/**
 * The row editor bound to the enclosing sheet's store: it follows the
 * selected row and writes through the store's `onCellEdited`, so an edit made
 * here is the same edit as one typed into the grid — same overlay, same
 * `onEdit` event, same reset. Render it anywhere under the `DataSheetProvider`
 * (the `DataSheet`'s children, a sibling panel, or a page where the grid
 * itself is not mounted).
 */
export function SelectedRowEditor(props: SelectedRowEditorProps) {
  const { emptyState = null, editable, ...rest } = props;
  const store = useStoreAPI();
  const columnSpec = useSelector((s) => s.columnSpec);
  const tableEditable = useSelector((s) => s.editable);
  const { rowIndex, row, edits, isDeleted } = useSelectedRow();

  if (rowIndex == null || row == null) {
    return h("div.row-editor-empty", emptyState);
  }

  const onChange = (columnKey: string, value: any) => {
    store.getState().onCellEdited(rowIndex, columnKey, value);
  };
  // Reverting a field is writing its loaded value back: the store drops an
  // override equal to the base, and a controlled consumer sees an ordinary
  // `setCells` rather than a whole-table reset.
  const onResetField = (columnKey: string) => {
    store.getState().onCellEdited(rowIndex, columnKey, row[columnKey]);
  };

  return h(RowEditor, {
    ...rest,
    columnSpec,
    row,
    edits,
    rowIndex,
    editable: (editable ?? true) && tableEditable && !isDeleted,
    onChange,
    onResetField,
  });
}

export type { CellValidation };
