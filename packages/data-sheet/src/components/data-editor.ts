/**
 * Data editor — one record's fields as a form, from a data spec.
 *
 * A **data spec** is a list of fields with the semantics of a sheet's column
 * spec — any column spec is one: a field's label is its `name`, its value is
 * drawn by its `valueRenderer`, and its editor is its `cellDetail` when it
 * has one, else an input chosen from `dataType`. Locked and derived fields
 * show read-only (`isColumnWritable`), `validate` and `required` flag values,
 * and the form as a whole is a read-only viewer when `editable` is off.
 *
 * `DataEditor` stands alone: it takes a record, keeps its own pending edits
 * (or takes them controlled), and has the sheet's save/reset semantics — a
 * footer with Reset and Save (disabled until there are edits, and while any
 * field has an error), `onSave` handed the edited record and the edits. Its
 * actions are a sheet's table actions scoped to the form: those for a row
 * act on the record, those for a cell or column on one field (see
 * `editor-actions.ts`). It has no notion of a selected field; that belongs to
 * a sheet.
 *
 * The parts it is built from are exported for the sheet's row editor, which
 * is this form over the sheet's selected rows: `DataEditorFields` (a form
 * over one record or several, writing through callbacks), `DataEditorFrame`
 * (the panel, its title bar and footer) and `DataEditorField`.
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
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  type CellDetailContext,
  type CellSelectionEntry,
  type CellValidation,
  type ColumnSpec,
  isColumnWritable,
} from "../provider";
import { validateCell } from "../utils/validation.ts";
import type { TableAction } from "../actions";
import {
  EditorActionButton,
  editorActionsFor,
  type EditorActionTarget,
} from "./editor-actions";
import styles from "./row-editor.module.sass";

const h = hyper.styled(styles);

/** A field of a data spec: a column spec's field, read the same way. */
export type FieldSpec = ColumnSpec;

export interface DataEditorProps<T = any> {
  /** The fields, in order. */
  dataSpec: FieldSpec[];
  /** The record as loaded. A new record clears pending edits (uncontrolled). */
  data: T;
  /** Pending edits, when the caller keeps them (controlled). */
  edits?: Partial<T>;
  /** Pending edits changed — every field change, reset and save. */
  onEditsChange?: (edits: Partial<T>) => void;
  /** Persist the edited record. Absent, the editor has no Save. A returned
   * promise holds the Save button busy; the edits clear once it resolves. */
  onSave?: (value: T, edits: Partial<T>) => void | Promise<void>;
  /** Whether the form takes edits (default). Off, it is a viewer. */
  editable?: boolean;
  /** A sheet's actions, scoped to the form (see `editor-actions.ts`): those
   * for a row as the record's, in the footer before Reset and Save; those
   * for a cell or a column, and a field's own column `actions`, beside each
   * field's label. */
  actions?: TableAction<T>[];
  /** Whether to show the actions (default). A sheet's own editors turn them
   * off, where its toolbar already carries them. */
  showActions?: boolean;
  /** Draw the form as a panel: bordered, with a title bar and footer. */
  panel?: boolean;
  title?: ReactNode;
  /** Close the editor — a ✕ in the title bar. */
  onClose?: () => void;
  closeLabel?: string;
  saveLabel?: string;
  showHidden?: boolean;
  hideEmpty?: boolean;
  inline?: boolean;
  className?: string;
  /** Rendered above the fields. */
  header?: ReactNode;
  children?: ReactNode;
}

export function DataEditor<T = any>(props: DataEditorProps<T>) {
  const {
    dataSpec,
    data,
    onEditsChange,
    onSave,
    editable = true,
    actions = [],
    showActions = true,
    panel = false,
    title,
    onClose,
    closeLabel,
    saveLabel = "Save",
    showHidden,
    hideEmpty,
    inline,
    className,
    header,
    children,
  } = props;

  const [ownEdits, setOwnEdits] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);
  // A new record starts clean
  useEffect(() => {
    setOwnEdits({});
  }, [data]);

  let edits = ownEdits;
  if (props.edits != null) edits = props.edits;
  // The latest edits, so several changes in one event (an action's batch of
  // cells) build on each other rather than on the last render's
  const latest = useRef(edits);
  latest.current = edits;
  const setEdits = (next: Partial<T>) => {
    latest.current = next;
    if (props.edits == null) setOwnEdits(next);
    onEditsChange?.(next);
  };

  const value = useMemo(() => ({ ...data, ...edits }) as T, [data, edits]);
  const hasChanges = Object.keys(edits).length > 0;
  const errors = useMemo(() => fieldErrors(dataSpec, value), [dataSpec, value]);

  const setFields = (patch: Record<string, any>) => {
    const updated: any = { ...latest.current };
    for (const [key, next] of Object.entries(patch)) {
      updated[key] = next;
      // A value set back to what was loaded is no edit
      if (valueToken(next) === valueToken((data as any)?.[key])) {
        delete updated[key];
      }
    }
    setEdits(updated);
  };
  const setField = (key: string, next: any) => setFields({ [key]: next });

  const resetField = (key: string) => {
    const updated: any = { ...latest.current };
    delete updated[key];
    setEdits(updated);
  };
  const reset = () => setEdits({});

  const save = async () => {
    if (onSave == null || !hasChanges || errors.length > 0) return;
    setSaving(true);
    try {
      await onSave(value, edits);
      setEdits({});
    } finally {
      setSaving(false);
    }
  };

  // What the actions act on: this record, as a one-row table
  const target: EditorActionTarget<T> = {
    dataSpec,
    data,
    value,
    edits,
    editable,
    setFields,
    reset,
    onSave,
  };
  let usedActions: TableAction<T>[] = [];
  if (showActions) usedActions = actions;
  const record = editorActionsFor(usedActions, target, { kind: "record" });

  let fieldActions: ((key: string) => ReactNode) | undefined;
  if (usedActions.length > 0 || dataSpec.some((d) => d.actions != null)) {
    fieldActions = (columnKey) => {
      if (!showActions) return null;
      const scoped = editorActionsFor(usedActions, target, {
        kind: "field",
        columnKey,
      });
      return scoped.actions.map((action) =>
        h(EditorActionButton<T>, {
          key: action.id,
          action,
          ctx: scoped.ctx,
          iconOnly: true,
        }),
      );
    };
  }

  let footer: ReactNode = null;
  if (editable && (onSave != null || record.actions.length > 0)) {
    let errorsTitle: string | undefined;
    if (errors.length > 0) {
      errorsTitle = errors.map((d) => d.message).join("; ");
    }
    footer = h("div.data-editor-footer", [
      record.actions.map((action) =>
        h(EditorActionButton<T>, { key: action.id, action, ctx: record.ctx }),
      ),
      h("span.data-editor-footer-spacer"),
      h(Button, {
        small: true,
        minimal: true,
        icon: "undo",
        text: "Reset",
        disabled: !hasChanges || saving,
        onClick: reset,
      }),
      h.if(onSave != null)(Button, {
        small: true,
        intent: "primary",
        icon: "floppy-disk",
        text: saveLabel,
        loading: saving,
        title: errorsTitle,
        disabled: !hasChanges || errors.length > 0,
        onClick: save,
      }),
    ]);
  }

  return h(
    DataEditorFrame,
    {
      className: classNames("data-editor", className, { editable }),
      panel,
      title,
      onClose,
      closeLabel,
      footer,
    },
    [
      header,
      h(DataEditorFields<T>, {
        dataSpec,
        rows: [data],
        rowEdits: [edits],
        surface: "editor",
        editable,
        showHidden,
        hideEmpty,
        inline,
        onChange: setField,
        onResetField: resetField,
        fieldActions,
      }),
      children,
    ],
  );
}

/** The fields whose values are errors. */
function fieldErrors<T>(
  dataSpec: FieldSpec[],
  value: T,
): { key: string; message: string }[] {
  const errors: { key: string; message: string }[] = [];
  for (const field of dataSpec) {
    if (field.hidden || !isColumnWritable(field, true)) continue;
    const result = validateCell(field, (value as any)?.[field.key], value, -1);
    if (result?.severity === "error") {
      errors.push({ key: field.key, message: result.message ?? field.name });
    }
  }
  return errors;
}

/* ------------------------------------------------------------ the fields */

export interface DataEditorFieldsProps<T = any> {
  /** The fields, in order; hidden ones are left out unless `showHidden`. */
  dataSpec: FieldSpec[];
  /** The records the form stands for — one, or several at once. */
  rows: (T | null | undefined)[];
  /** Edit overlays aligned with `rows`. */
  rowEdits?: (Partial<T> | null | undefined)[];
  /** The rows' data indices, aligned with `rows`, handed to `validate` and
   * `cellDetail`. */
  rowIndices?: number[];
  /** Where the form is drawn, handed to each `cellDetail` as `ctx.surface`. */
  surface: CellDetailContext["surface"];
  /** Whether the form takes edits. */
  editable?: boolean;
  /** A field changed — for every row the form stands for. */
  onChange?: (key: string, value: any) => void;
  /** A field changed row by row, a value per row. */
  onChangeCells?: (key: string, values: any[]) => void;
  /** Revert one field in every row. */
  onResetField?: (key: string) => void;
  /** The only fields that take edits (the rest shown for context); `null`
   * for all. A sheet's cell selection. */
  focusFields?: string[] | null;
  /** A field to mark without narrowing what is editable. */
  activeField?: string | null;
  /** A field was clicked. */
  onFieldClick?: (key: string) => void;
  /** Controls beside a field's label — its actions. */
  fieldActions?: (key: string) => ReactNode;
  showHidden?: boolean;
  hideEmpty?: boolean;
  inline?: boolean;
}

/** A form over one record or several, writing through callbacks. Over
 * several, each field stands for that key in every record: a shared value is
 * shown and edited as one, differing ones read "Multiple values", and a
 * field's own `cellDetail` edits them only when it declares `multiCell`. */
export function DataEditorFields<T = any>(props: DataEditorFieldsProps<T>) {
  const {
    dataSpec,
    rows,
    rowEdits = [],
    rowIndices = [],
    surface,
    editable = true,
    onChange,
    onChangeCells,
    onResetField,
    focusFields = null,
    activeField = null,
    onFieldClick,
    fieldActions,
    showHidden = false,
    hideEmpty = false,
    inline = false,
  } = props;

  const merged = useMemo(
    () => rows.map((row, i) => ({ ...(row ?? {}), ...(rowEdits[i] ?? {}) })),
    [rows, rowEdits],
  );
  const several = rows.length > 1;

  const fieldsShown = useMemo(
    () => dataSpec.filter((field) => showHidden || !field.hidden),
    [dataSpec, showHidden],
  );

  const canEdit = editable && onChange != null;
  let focus: Set<string> | null = null;
  if (focusFields != null) focus = new Set(focusFields);

  const fields = fieldsShown.map((col, colIndex) => {
    const values = merged.map((row) => row[col.key]);
    const shared = sharedValue(values);
    let value = shared.value;
    if (shared.mixed) value = undefined;
    const focused = focus == null || focus.has(col.key);
    // A field's own surface edits several records only when it says it can;
    // the default editors always can.
    const canEditSeveral =
      !several || col.cellDetail == null || (col.multiCell ?? false);
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
      surface,
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
    let onReset: (() => void) | null = null;
    if (isEdited && onResetField != null) onReset = ctx.resetValue;
    return h(DataEditorField, {
      key: col.key,
      ctx,
      inline,
      onClick,
      actions: fieldActions?.(col.key),
      selected:
        (focus != null && focus.has(col.key)) || activeField === col.key,
      onReset,
    });
  });

  return h(
    "div.row-editor-fields",
    { className: classNames({ editable: canEdit, inline, several }) },
    fields,
  );
}

/* ------------------------------------------------------------- the frame */

/** The form's frame: as a panel, a title bar over a scrolling body and an
 * optional footer; otherwise the body (and footer) alone. The title bar is
 * the sheet toolbar's selection tag at full width — minimal, large, primary —
 * and its ✕ is the tag's own. */
export function DataEditorFrame({
  panel = false,
  title,
  onClose,
  closeLabel = "Close",
  footer,
  className,
  children,
}: {
  panel?: boolean;
  title?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  footer?: ReactNode;
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
    footer,
  ]);
}

/* ---------------------------------------------------------- shared values */

/** The value a set of cells share, or that they differ. Structured values
 * compare by their JSON form, so two equal lithology arrays count as one. */
export function sharedValue(values: any[]): { value: any; mixed: boolean } {
  if (values.length === 0) return { value: undefined, mixed: false };
  const first = values[0];
  const key = valueToken(first);
  for (const v of values.slice(1)) {
    if (valueToken(v) !== key) return { value: undefined, mixed: true };
  }
  return { value: first, mixed: false };
}

export function valueToken(value: any): string {
  if (value == null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ------------------------------------------------------------------ field */

interface DataEditorFieldProps {
  ctx: CellDetailContext;
  inline?: boolean;
  /** Controls after the label: the field's actions. */
  actions?: ReactNode;
  /** A click anywhere in the field. */
  onClick?: () => void;
  /** Part of the cell selection the form is focused on. */
  selected?: boolean;
  onReset?: (() => void) | null;
}

/** One field: the column's name, a marker for what kind of value it is, the
 * value or its editor, and any validation message. */
export function DataEditorField({
  ctx,
  inline,
  selected = false,
  onReset,
  onClick,
  actions,
}: DataEditorFieldProps) {
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
    h.if(actions != null)("span.field-actions", actions),
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
