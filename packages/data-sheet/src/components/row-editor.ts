/**
 * Row editor — a selection's fields as a form, derived from the column spec.
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
 * **Several rows at once.** Over a multi-row selection each field stands for
 * that column's cells in every selected row. A value they share is shown and
 * edited as one; where they differ the field reads "Multiple values". A
 * default editor (an input by `dataType`) sets one value on every cell, which
 * is always meaningful; a column's own `cellDetail` edits several cells only
 * when the column declares `multiCell`, and is otherwise shown read-only.
 *
 * **A cell selection.** When particular cells are selected rather than whole
 * rows, the columns they fall in are the *focus*: those fields are editable
 * and marked as selected, and the rest of the row is shown for context,
 * read-only.
 *
 * `RowEditor` knows nothing about the sheet's store: it takes rows, their edit
 * overlays, and an `onChange`, so a consumer can mount it beside a table, in a
 * dialog, or on a page where the table isn't rendered at all.
 * `SelectedRowEditor` binds it to a `DataSheetProvider`'s store — the selected
 * rows and columns, the edit overlay, the `editable` flag — and writes through
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
import { RegionCardinality } from "@blueprintjs/table";
import {
  type CellDetailContext,
  type CellSelectionEntry,
  type CellValidation,
  type ColumnSpec,
  isColumnWritable,
  useSelector,
  useStoreAPI,
} from "../provider";
import {
  getSelectedColumnKeys,
  getSelectedRowIndices,
  getSelectionCardinality,
} from "../actions/selection.ts";
import { validateCell } from "../utils/validation.ts";
import styles from "./row-editor.module.sass";

const h = hyper.styled(styles);

export interface RowEditorProps<T = any> {
  /** The columns to show, in order. Hidden columns are left out unless
   * `showHidden` is set; derived and locked columns show read-only. */
  columnSpec: ColumnSpec[];
  /** The row as loaded (the base values). One row; see `rows` for several. */
  row?: T | null;
  /** The pending edits to `row`, laid over it for display. A field present
   * here is marked as edited. */
  edits?: Partial<T> | null;
  /** Several rows at once (a multi-row selection). Takes precedence over
   * `row`. Each field then stands for that column across all of them. */
  rows?: T[];
  /** Edit overlays aligned with `rows`. */
  rowEdits?: (Partial<T> | null | undefined)[];
  /** The rows' data indices, aligned with `rows`, handed to `validate` and
   * `cellDetail`. */
  rowIndices?: number[];
  /** The columns the selection falls in, when it is a cell selection rather
   * than whole rows. Those fields are editable and marked; the others are
   * shown read-only for context. `null` means every writable field. */
  focusColumns?: string[] | null;
  /** Whether the form takes edits at all. Off, it is a row *viewer*. */
  editable?: boolean;
  /** A field was changed — for every row the form stands for. Absent, the
   * form is read-only. */
  onChange?: (columnKey: string, value: any) => void;
  /** Revert one field to its base value, in every row. Absent, edited fields
   * have no revert affordance. */
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
    focusColumns = null,
    editable = true,
    onChange,
    onResetField,
    showHidden = false,
    hideEmpty = false,
    inline = false,
    className,
    header,
    children,
  } = props;

  const { rows, rowEdits, rowIndices } = resolveRows(props);
  const merged = useMemo(
    () => rows.map((row, i) => ({ ...(row ?? {}), ...(rowEdits[i] ?? {}) })),
    [rows, rowEdits],
  );
  const several = rows.length > 1;

  const columns = useMemo(
    () => columnSpec.filter((col) => showHidden || !col.hidden),
    [columnSpec, showHidden],
  );

  const canEdit = editable && onChange != null;
  const focus = focusColumns == null ? null : new Set(focusColumns);

  const fields = columns.map((col, colIndex) => {
    const values = merged.map((row) => row[col.key]);
    const shared = sharedValue(values);
    const value = shared.mixed ? undefined : shared.value;
    const focused = focus == null || focus.has(col.key);
    // A column's own surface edits several cells only when it says it can;
    // the default editors always can.
    const canEditSeveral = !several || col.cellDetail == null || col.multiCell;
    const writable =
      canEdit && focused && canEditSeveral && isColumnWritable(col, true);
    const isEmpty = value == null || value === "";
    if (hideEmpty && isEmpty && !shared.mixed && !writable) return null;
    const isEdited = rowEdits.some((e) => e != null && col.key in e);
    let validation: CellValidation | null = null;
    if (!shared.mixed) {
      validation = validateCell(col, value, merged[0], rowIndices[0] ?? -1);
    }
    const ctx: CellDetailContext = {
      value,
      rowIndex: rowIndices[0] ?? -1,
      colIndex,
      column: col,
      row: merged[0],
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
    if (several) {
      ctx.cells = rows.map((row, i): CellSelectionEntry => ({
        rowIndex: rowIndices[i] ?? -1,
        row: merged[i],
        value: values[i],
      }));
      ctx.mixed = shared.mixed;
    }
    return h(RowEditorField, {
      key: col.key,
      ctx,
      inline,
      selected: focus != null && focus.has(col.key),
      onReset: isEdited && onResetField != null ? ctx.resetValue : null,
    });
  });

  return h(
    "div.row-editor",
    {
      className: classNames(className, {
        editable: canEdit,
        inline,
        several,
      }),
    },
    [header, h("div.row-editor-fields", fields), children],
  );
}

/** One row or several, as arrays either way. */
function resolveRows<T>(props: RowEditorProps<T>): {
  rows: (T | null | undefined)[];
  rowEdits: (Partial<T> | null | undefined)[];
  rowIndices: number[];
} {
  if (props.rows != null) {
    return {
      rows: props.rows,
      rowEdits: props.rowEdits ?? [],
      rowIndices: props.rowIndices ?? [],
    };
  }
  return {
    rows: [props.row],
    rowEdits: [props.edits],
    rowIndices: props.rowIndices ?? [],
  };
}

/** The value a set of cells share, or that they differ. Structured values
 * compare by their JSON form, so two equal lithology arrays count as one. */
function sharedValue(values: any[]): { value: any; mixed: boolean } {
  if (values.length === 0) return { value: undefined, mixed: false };
  const first = values[0];
  const key = valueToken(first);
  for (const v of values.slice(1)) {
    if (valueToken(v) !== key) return { value: undefined, mixed: true };
  }
  return { value: first, mixed: false };
}

function valueToken(value: any): string {
  if (value == null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ------------------------------------------------------------------ field */

interface RowEditorFieldProps {
  ctx: CellDetailContext;
  inline?: boolean;
  /** Part of the cell selection the form is focused on. */
  selected?: boolean;
  onReset?: (() => void) | null;
}

/** One field: the column's name, a marker for what kind of value it is, the
 * value or its editor, and any validation message. */
export function RowEditorField({
  ctx,
  inline,
  selected = false,
  onReset,
}: RowEditorFieldProps) {
  const { column: col, validation, isEdited, editable, mixed } = ctx;

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
        selected,
        mixed,
        "read-only": !editable,
        [`data-type-${col.dataType ?? "string"}`]: true,
      }),
    },
    h(FieldSurface, { ctx }),
  );
}

/** The value or its editor: the column's own `cellDetail` when it has one
 * (the unified surface, which is an editor when `ctx.editable`), else a
 * default by `dataType`. A surface that can't stand for several cells shows
 * the shared value, or "Multiple values". */
function FieldSurface({ ctx }: { ctx: CellDetailContext }) {
  const { column: col, editable } = ctx;
  const several = ctx.cells != null;
  if (col.cellDetail != null && (!several || col.multiCell)) {
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
  if (ctx.mixed) {
    return h(MixedValues, { ctx });
  }
  if (value == null || value === "") {
    return h("span.field-value.empty", "—");
  }
  const rendered = col.valueRenderer?.(value, ctx) ?? String(value);
  return h("span.field-value", rendered);
}

/** "Multiple values", naming how many distinct ones the cells hold. */
export function MixedValues({ ctx }: { ctx: CellDetailContext }) {
  const distinct = new Set((ctx.cells ?? []).map((c) => valueToken(c.value)));
  return h(
    "span.field-value.mixed-values",
    {
      title: `${distinct.size} distinct values across ${ctx.cells?.length} rows`,
    },
    "Multiple values",
  );
}

function DefaultFieldEditor({ ctx }: { ctx: CellDetailContext }) {
  const { value, column: col, onChange, mixed } = ctx;
  const type = col.dataType ?? "string";
  const placeholder = mixed ? "Multiple values" : undefined;

  if (type === "boolean") {
    return h(Switch, {
      checked: Boolean(value),
      // An indeterminate switch has no Blueprint form; say so beside it.
      label: mixed ? "Multiple values" : undefined,
      onChange: (evt: any) => onChange(evt.target.checked),
      className: "field-switch",
    });
  }
  if (type === "text") {
    return h(CommittedTextArea, { value, placeholder, onCommit: onChange });
  }
  if (type === "number" || type === "integer") {
    return h(CommittedInput, {
      value,
      placeholder,
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
  return h(CommittedInput, { value, placeholder, onCommit: onChange });
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
  placeholder,
}: {
  value: any;
  onCommit: (text: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(toText(value));
  useEffect(() => {
    setText(toText(value));
  }, [value]);
  return h(TextArea, {
    small: true,
    fill: true,
    autoResize: true,
    placeholder,
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

export interface SelectedRows<T = any> {
  /** Data indices of the selected rows; empty when nothing is selected. */
  rowIndices: number[];
  rows: (T | null | undefined)[];
  edits: (Partial<T> | null | undefined)[];
  /** The columns a cell selection falls in; `null` for whole rows (or the
   * whole table), when every column is in play. */
  columnKeys: string[] | null;
  cardinality: RegionCardinality | null;
  /** Whether any selected row is marked deleted. */
  anyDeleted: boolean;
}

/** The rows the sheet's selection addresses, with their edit overlays and the
 * columns the selection falls in. Must be read inside a
 * `DataSheetProvider`. */
export function useSelectedRows<T = any>(): SelectedRows<T> {
  const selection = useSelector((s) => s.selection);
  const data = useSelector((s) => s.data);
  const updatedData = useSelector((s) => s.updatedData);
  const rowStatus = useSelector((s) => s.rowStatus);
  const columnSpec = useSelector((s) => s.columnSpec);
  const filteredRowIndices = useSelector((s) => s.filteredRowIndices);

  return useMemo(() => {
    const regions = selection ?? [];
    const rowIndices = getSelectedRowIndices(regions, filteredRowIndices);
    const cardinality = getSelectionCardinality(regions) ?? null;
    let columnKeys: string[] | null = null;
    if (cardinality === RegionCardinality.CELLS) {
      columnKeys = getSelectedColumnKeys(regions, columnSpec);
    }
    return {
      rowIndices,
      rows: rowIndices.map((i) => data?.[i] as T | null | undefined),
      edits: rowIndices.map((i) => updatedData?.[i] as Partial<T> | undefined),
      columnKeys,
      cardinality,
      anyDeleted: rowIndices.some((i) => rowStatus?.[i] === "deleted"),
    };
  }, [selection, data, updatedData, rowStatus, columnSpec, filteredRowIndices]);
}

export interface SelectedRow<T = any> {
  rowIndex: number | null;
  row: T | null;
  edits: Partial<T> | null;
  isDeleted: boolean;
}

/** The first selected row alone — the single-row view of `useSelectedRows`. */
export function useSelectedRow<T = any>(): SelectedRow<T> {
  const { rowIndices, rows, edits, anyDeleted } = useSelectedRows<T>();
  if (rowIndices.length === 0) {
    return { rowIndex: null, row: null, edits: null, isDeleted: false };
  }
  return {
    rowIndex: rowIndices[0],
    row: rows[0] ?? null,
    edits: edits[0] ?? null,
    isDeleted: anyDeleted,
  };
}

export interface SelectedRowEditorProps extends Omit<
  RowEditorProps,
  | "columnSpec"
  | "row"
  | "edits"
  | "rows"
  | "rowEdits"
  | "rowIndices"
  | "focusColumns"
  | "onChange"
  | "onResetField"
> {
  /** Shown when no row is selected. */
  emptyState?: ReactNode;
  /** Shown above the fields over a multi-row selection; the default names
   * the count. Pass `null` for nothing. */
  selectionSummary?: (count: number) => ReactNode;
}

/**
 * The row editor bound to the enclosing sheet's store: it follows the
 * selected rows and the columns a cell selection falls in, and writes through
 * the store's `onCellEdited` for every selected row, so an edit made here is
 * the same edit as one typed into the grid — same overlay, same `onEdit`
 * events, same reset. Render it anywhere under the `DataSheetProvider` (the
 * `DataSheet`'s children, a sibling panel, or a page where the grid itself is
 * not mounted).
 */
export function SelectedRowEditor(props: SelectedRowEditorProps) {
  const {
    emptyState = null,
    selectionSummary = defaultSelectionSummary,
    editable,
    header,
    ...rest
  } = props;
  const store = useStoreAPI();
  const columnSpec = useSelector((s) => s.columnSpec);
  const tableEditable = useSelector((s) => s.editable);
  const { rowIndices, rows, edits, columnKeys, anyDeleted } = useSelectedRows();

  if (rowIndices.length === 0) {
    return h("div.row-editor-empty", emptyState);
  }

  const onChange = (columnKey: string, value: any) => {
    const { onCellEdited } = store.getState();
    for (const rowIndex of rowIndices) onCellEdited(rowIndex, columnKey, value);
  };
  // Reverting a field is writing its loaded value back: the store drops an
  // override equal to the base, and a controlled consumer sees an ordinary
  // `setCells` rather than a whole-table reset.
  const onResetField = (columnKey: string) => {
    const { onCellEdited } = store.getState();
    rowIndices.forEach((rowIndex, i) => {
      const base = rows[i];
      if (base == null) return;
      onCellEdited(rowIndex, columnKey, base[columnKey]);
    });
  };

  let summary: ReactNode = null;
  if (rowIndices.length > 1 && selectionSummary != null) {
    summary = h("div.selection-summary", selectionSummary(rowIndices.length));
  }

  return h(RowEditor, {
    ...rest,
    columnSpec,
    rows,
    rowEdits: edits,
    rowIndices,
    focusColumns: columnKeys,
    header: h([header, summary]),
    editable: (editable ?? true) && tableEditable && !anyDeleted,
    onChange,
    onResetField,
  });
}

function defaultSelectionSummary(count: number): ReactNode {
  return `${count} rows selected — a change here applies to all of them.`;
}

export type { CellValidation };
