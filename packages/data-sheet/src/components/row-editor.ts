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
 * stream as typing into the grid. It is drawn as a panel, titled with what it
 * is doing to how many of the sheet's items ("Editing 3 samples") in a bar
 * drawn as the toolbar's selection tag, whose ✕ clears the selection.
 *
 * Whether it is shown at all is the sheet's `rowEditorOpenAtom`, which the
 * toolbar's `ShowRowEditor` control toggles (add `showRowEditorAction` to a
 * sheet's `actions`), so the editor can be mounted wherever the layout wants
 * it and still be switched from the sheet.
 */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import {
  Button,
  FormGroup,
  InputGroup,
  Intent,
  type IconName,
  NonIdealState,
  Switch,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { atom } from "jotai";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type Region, RegionCardinality } from "@blueprintjs/table";
import {
  type CellDetailContext,
  type CellSelectionEntry,
  type CellValidation,
  type ColumnSpec,
  ctx as sheetScope,
  isColumnWritable,
  itemLabelAtom,
  pluralize,
  selectionAtom,
  useSelector,
  useStoreAPI,
} from "../provider";
import {
  getSelectedColumnKeys,
  getSelectedRowIndices,
  getSelectionCardinality,
} from "../actions/selection.ts";
import type { TableAction } from "../actions";
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
  /** A field was changed row by row: a value for each of the form's rows,
   * aligned with them (a `cellDetail`'s `onChangeCells`). */
  onChangeCells?: (columnKey: string, values: any[]) => void;
  /** The field to mark as active — the cell the sheet has selected, when the
   * selection came from the form — without narrowing what is editable. */
  activeColumn?: string | null;
  /** A field was clicked. */
  onFieldClick?: (columnKey: string) => void;
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
  /** Draw the form as a panel: bordered, with a title bar. */
  panel?: boolean;
  /** The panel's title ("Editing 1 row"). */
  title?: ReactNode;
  /** Close the panel — a ✕ at the end of the title bar. */
  onClose?: () => void;
  /** A label for the ✕ ("Clear selection"). */
  closeLabel?: string;
  /** Rendered above the fields. */
  header?: ReactNode;
  children?: ReactNode;
}

export function RowEditor<T = any>(props: RowEditorProps<T>) {
  const {
    columnSpec,
    focusColumns = null,
    editable = true,
    onChange,
    onChangeCells,
    activeColumn = null,
    onFieldClick,
    onResetField,
    showHidden = false,
    hideEmpty = false,
    inline = false,
    className,
    panel = false,
    title,
    onClose,
    closeLabel,
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
      surface: "row-editor",
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
      if (onChangeCells != null) {
        ctx.onChangeCells = (next) => {
          if (!writable) return;
          onChangeCells(col.key, next);
        };
      }
    }
    let onClick: (() => void) | undefined;
    if (onFieldClick != null) onClick = () => onFieldClick(col.key);
    return h(RowEditorField, {
      key: col.key,
      ctx,
      inline,
      onClick,
      selected:
        (focus != null && focus.has(col.key)) || activeColumn === col.key,
      onReset: isEdited && onResetField != null ? ctx.resetValue : null,
    });
  });

  return h(
    RowEditorFrame,
    {
      className: classNames(className, { editable: canEdit, inline, several }),
      panel,
      title,
      onClose,
      closeLabel,
    },
    [header, h("div.row-editor-fields", fields), children],
  );
}

/** The form's frame: as a panel, a title bar over a scrolling body;
 * otherwise the body alone. The title bar is the toolbar's selection tag at
 * full width — minimal, large, primary — and its ✕ is the tag's own. */
export function RowEditorFrame({
  panel = false,
  title,
  onClose,
  closeLabel = "Close",
  className,
  children,
}: {
  panel?: boolean;
  title?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  let titleBar: ReactNode = null;
  if (panel && (title != null || onClose != null)) {
    titleBar = h(
      Tag,
      {
        minimal: true,
        large: true,
        fill: true,
        intent: "primary",
        className: "row-editor-title-bar",
        onRemove: onClose,
        removeButtonProps: { title: closeLabel, "aria-label": closeLabel },
      } as any,
      title,
    );
  }
  return h("div.row-editor", { className: classNames(className, { panel }) }, [
    titleBar,
    h("div.row-editor-body", children),
  ]);
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
  /** A click anywhere in the field. */
  onClick?: () => void;
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
  onClick,
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

  // The wrapper takes no space (`display: contents`); it catches the click
  // Blueprint's FormGroup doesn't pass through
  return h(
    "div.row-editor-field-target",
    { onClick },
    h(
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
    ),
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
  /** Shown when no row is selected. Defaults to a `NonIdealState` saying so
   * ("No units selected"). */
  emptyState?: ReactNode;
  /** Shown above the fields over a multi-row selection; the default says a
   * change applies to all of them. Pass `null` for nothing. */
  selectionSummary?: ((count: number) => ReactNode) | null;
  /** Whether the panel's ✕ clears the selection (default). */
  closeable?: boolean;
  /** Follow the sheet's `rowEditorOpenAtom`, rendering nothing while it is
   * off (default). */
  toggleable?: boolean;
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
    emptyState,
    selectionSummary,
    closeable = true,
    toggleable = true,
    panel = true,
    editable,
    header,
    ...rest
  } = props;
  const store = useStoreAPI();
  const columnSpec = useSelector((s) => s.columnSpec);
  const tableEditable = useSelector((s) => s.editable);
  const itemLabel = sheetScope.useValue(itemLabelAtom);
  // Not the store's `clearSelection`, which clears the selected cells' values
  const setSelection = sheetScope.useSet(selectionAtom);
  const open = sheetScope.useValue(rowEditorOpenAtom);
  const selection = useSelector((s) => s.selection);
  const filteredRowIndices = useSelector((s) => s.filteredRowIndices);
  const { rowIndices, rows, edits, columnKeys, anyDeleted } = useSelectedRows();
  const count = rowIndices.length;
  // A click on a field selects its cells in the sheet. That selection is the
  // form's own: it marks the field without narrowing the form to it, as a
  // cell selection made in the grid would.
  const formSelection = useRef<{ regions: Region[]; key: string } | null>(null);
  let activeColumn: string | null = null;
  let focusColumns = columnKeys;
  const own = formSelection.current;
  if (own != null && sameRegions(own.regions, selection ?? [])) {
    activeColumn = own.key;
    focusColumns = null;
  }
  const items = `${count} ${pluralize(itemLabel, count)}`;

  if (toggleable && !open) return null;

  if (count === 0) {
    let empty = emptyState;
    if (empty === undefined) {
      empty = h(NonIdealState, {
        title: `No ${pluralize(itemLabel, 0)} selected`,
        className: "row-editor-non-ideal",
      });
    }
    return h(RowEditorFrame, { panel, className: "row-editor-empty" }, empty);
  }

  const canEdit = (editable ?? true) && tableEditable && !anyDeleted;
  let title = `Viewing ${items}`;
  if (canEdit) title = `Editing ${items}`;

  let onClose: (() => void) | undefined;
  if (closeable) onClose = () => setSelection([]);

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

  const onChangeCells = (columnKey: string, values: any[]) => {
    const { onCellEdited } = store.getState();
    rowIndices.forEach((rowIndex, i) => {
      onCellEdited(rowIndex, columnKey, values[i]);
    });
  };

  const onFieldClick = (columnKey: string) => {
    if (activeColumn === columnKey) return;
    const regions = cellRegions(
      rowIndices,
      columnSpec.findIndex((c) => c.key === columnKey),
      filteredRowIndices,
    );
    if (regions.length === 0) return;
    formSelection.current = { regions, key: columnKey };
    const state = store.getState();
    // Selecting from the form opens nothing over the grid
    store.setState({ cellSurfaceOpen: false });
    state.setSelection(regions);
  };

  let summary: ReactNode = null;
  if (count > 1 && canEdit && selectionSummary !== null) {
    let text: ReactNode = `A change here applies to all ${items}.`;
    if (selectionSummary != null) text = selectionSummary(count);
    summary = h("div.selection-summary", text);
  }

  return h(RowEditor, {
    ...rest,
    columnSpec,
    rows,
    rowEdits: edits,
    rowIndices,
    focusColumns,
    activeColumn,
    onFieldClick,
    panel,
    title,
    onClose,
    closeLabel: "Clear selection",
    header: h([header, summary]),
    editable: canEdit,
    onChange,
    onChangeCells,
    onResetField,
  });
}

/** One column's cells in the given rows, as the table's regions: the rows'
 * places in the view (under any filter), one region per run of adjacent
 * rows. */
function cellRegions(
  rowIndices: number[],
  colIndex: number,
  filteredRowIndices: number[] | null | undefined,
): Region[] {
  if (colIndex < 0) return [];
  const visible = rowIndices
    .map((i) => {
      if (filteredRowIndices == null) return i;
      return filteredRowIndices.indexOf(i);
    })
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const regions: Region[] = [];
  for (const row of visible) {
    const last = regions[regions.length - 1];
    if (last != null && last.rows![1] === row - 1) {
      last.rows = [last.rows![0], row];
      continue;
    }
    regions.push({ rows: [row, row], cols: [colIndex, colIndex] });
  }
  return regions;
}

function sameRegions(a: Region[], b: Region[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((r, i) => {
    const s = b[i];
    return (
      r.rows?.[0] === s.rows?.[0] &&
      r.rows?.[1] === s.rows?.[1] &&
      r.cols?.[0] === s.cols?.[0] &&
      r.cols?.[1] === s.cols?.[1]
    );
  });
}

/* ------------------------------------------------------------ the toggle */

/** Whether the sheet's row editor is shown. Scoped to the sheet, like the
 * rest of its state; `SelectedRowEditor` follows it unless `toggleable` is
 * off. */
export const rowEditorOpenAtom = atom(true);

/** The row editor's open state, and a setter. */
export function useRowEditorOpen(): [boolean, (open: boolean) => void] {
  const open = sheetScope.useValue(rowEditorOpenAtom);
  const setOpen = sheetScope.useSet(rowEditorOpenAtom);
  return [open, setOpen];
}

/** A toolbar toggle for the row editor, wherever it is mounted. */
export function ShowRowEditor({
  label = "Row editor",
  icon = "properties",
}: {
  label?: string;
  icon?: IconName;
}) {
  const [open, setOpen] = useRowEditorOpen();
  let title = "Show the row editor";
  if (open) title = "Hide the row editor";
  return h(Button, {
    minimal: true,
    small: true,
    icon,
    active: open,
    text: label,
    title,
    "aria-pressed": open,
    onClick: () => setOpen(!open),
  });
}

/** `ShowRowEditor` as a sheet action: add it to `actions` and the toggle sits
 * at the toolbar's right end, whatever is selected, editable or not. */
export const showRowEditorAction: TableAction = {
  id: "show-row-editor",
  name: "Row editor",
  icon: "properties",
  targets: [
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: false,
  placement: "end",
  render: () => h(ShowRowEditor),
};

export type { CellValidation };
