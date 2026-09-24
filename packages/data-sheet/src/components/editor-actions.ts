/**
 * Table actions in a form.
 *
 * A form's actions are a sheet's actions scoped to one row, one column or
 * one cell — the single-selection cases — so a set of `TableAction`s serves
 * both. In a form over one record:
 *
 * - **record actions** are those for a row selection (`FULL_ROWS`), run as if
 *   the record's row were selected, and shown in the editor's footer;
 * - **field actions** are those for a cell or column selection (`CELLS`,
 *   `FULL_COLUMNS`), plus a field's own column `actions`, run as if that one
 *   cell were selected, and shown beside the field's label.
 *
 * Actions for the whole table (targeting `FULL_TABLE` — Save, Reset) are
 * left out, as are live controls (`render`, the sort and filter widgets) and
 * keyboard-bound ones (`hotkey`), which belong to a sheet. An action's
 * `appliesTo` decides as it does in a sheet, against the scoped context.
 *
 * The context an action gets is built over the record as a one-row table:
 * `onCellEdited` / `editCells` set the form's fields, `resetChanges` resets
 * it, `getSelectedRows()` is the record as edited, and `saveRows` saves
 * through the form's `onSave`. Nothing else in a sheet exists here, so the
 * rest of the context is inert.
 */
import hyper from "@macrostrat/hyper";
import { type ReactNode, useState } from "react";
import { Button, PopoverNext } from "@blueprintjs/core";
import { type Region, RegionCardinality } from "@blueprintjs/table";
import type { TableAction, TableActionContext } from "../actions";
import { computeSelectionShape } from "../actions/selection.ts";
import type { CellEdit, ColumnSpec } from "../provider";
import styles from "./row-editor.module.sass";

const h = hyper.styled(styles);

/** What a form offers actions to act on. */
export interface EditorActionTarget<T = any> {
  dataSpec: ColumnSpec[];
  /** The record as loaded. */
  data: T;
  /** The record with its pending edits. */
  value: T;
  edits: Partial<T>;
  editable: boolean;
  /** Set several fields at once. */
  setFields: (patch: Record<string, any>) => void;
  reset: () => void;
  onSave?: (value: T, edits: Partial<T>) => void | Promise<void>;
}

export type EditorActionScope =
  { kind: "record" } | { kind: "field"; columnKey: string };

/** The actions for a scope, and their context. */
export function editorActionsFor<T>(
  actions: TableAction<T>[],
  target: EditorActionTarget<T>,
  scope: EditorActionScope,
): { actions: TableAction<T>[]; ctx: TableActionContext<T> } {
  const ctx = editorActionContext(target, scope);
  let candidates = actions;
  let cardinalities = [RegionCardinality.FULL_ROWS];
  if (scope.kind === "field") {
    const field = target.dataSpec.find((d) => d.key === scope.columnKey);
    candidates = [...actions, ...((field?.actions as TableAction<T>[]) ?? [])];
    cardinalities = [RegionCardinality.CELLS, RegionCardinality.FULL_COLUMNS];
  }
  const applicable = candidates.filter((action) => {
    if (action.render != null || action.hotkey != null) return false;
    if (action.targets.includes(RegionCardinality.FULL_TABLE)) return false;
    if (!cardinalities.some((c) => action.targets.includes(c))) return false;
    if (action.requiresEditable && !target.editable) return false;
    return action.appliesTo?.(ctx) ?? true;
  });
  return { actions: applicable, ctx };
}

/** A table action's context over a form's record, scoped to the record or
 * one of its fields. */
export function editorActionContext<T>(
  target: EditorActionTarget<T>,
  scope: EditorActionScope,
): TableActionContext<T> {
  const { dataSpec, data, value, edits, editable } = target;
  let selection: Region[] = [{ rows: [0, 0] }];
  let columnKey: string | null = null;
  if (scope.kind === "field") {
    columnKey = scope.columnKey;
    const col = dataSpec.findIndex((d) => d.key === columnKey);
    selection = [{ rows: [0, 0], cols: [col, col] }];
  }
  const setCell = (_row: number, key: string, next: any) =>
    target.setFields({ [key]: next });
  const noop = () => {};

  let saveRows: TableActionContext<T>["saveRows"];
  if (target.onSave != null) {
    const onSave = target.onSave;
    saveRows = async (rows) => {
      const next = rows[0] ?? value;
      const changed: any = {};
      for (const key of Object.keys(next as any)) {
        if ((next as any)[key] !== (data as any)?.[key]) {
          changed[key] = (next as any)[key];
        }
      }
      await onSave(next, changed);
    };
  }

  return {
    selection,
    selectionCardinality: computeSelectionShape(selection).cardinality,
    selectionShape: computeSelectionShape(selection),
    columnKey,
    rowIndex: 0,
    cell: columnKey != null ? { rowIndex: 0, columnKey } : null,
    data: [data],
    updatedData: [edits as T],
    rowStatus: [],
    columnSpec: dataSpec,
    editable,
    canDeleteRows: false,
    getSelectedRowIndices: () => [0],
    getSelectedRows: () => [value],
    getSelectedColumnKeys: () => {
      if (columnKey != null) return [columnKey];
      return dataSpec.map((d) => d.key);
    },
    saveRows,
    onCellEdited: setCell,
    editCells(cellEdits: CellEdit[]) {
      const patch: Record<string, any> = {};
      for (const e of cellEdits) {
        patch[(e as any).columnKey ?? e.column] = e.value;
      }
      target.setFields(patch);
    },
    deleteSelectedRows: noop,
    addRow: noop,
    setUpdatedData(next: any) {
      let rows = next;
      if (typeof next === "function") rows = next([edits]);
      target.reset();
      target.setFields(rows?.[0] ?? {});
    },
    resetChanges: target.reset,
    clearSelection: noop,
    scrollToRow: noop,
    setState: noop,
    clipboardProxy: null,
    setClipboardProxy: noop,
    filteredRowIndices: null,
  } as TableActionContext<T>;
}

/** A form's action: a button, or — with a `detailsForm` — a button opening
 * its form and a Run. `iconOnly` for the small buttons beside a field. */
export function EditorActionButton<T>({
  action,
  ctx,
  iconOnly = false,
}: {
  action: TableAction<T, any>;
  ctx: TableActionContext<T>;
  iconOnly?: boolean;
}) {
  const [state, setState] = useState(action.defaultState ?? null);
  const [open, setOpen] = useState(false);
  let disabled = false;
  if (typeof action.disabled === "boolean") disabled = action.disabled;
  if (typeof action.disabled === "function") disabled = action.disabled(ctx);

  const run = async (config?: any) => {
    try {
      await action.run?.(ctx, config);
    } catch (err) {
      console.error(err);
    }
  };

  let text: ReactNode = action.name;
  if (iconOnly && action.icon != null) text = undefined;
  const button = h(Button, {
    small: true,
    minimal: true,
    icon: action.icon,
    intent: action.intent,
    text,
    title: action.description ?? action.name,
    disabled,
    className: "editor-action",
    onClick() {
      if (action.detailsForm != null) {
        setOpen(!open);
        return;
      }
      run();
    },
  });
  if (action.detailsForm == null) return button;

  let ready = true;
  if (action.isReady != null) ready = action.isReady(state);
  return h(
    PopoverNext,
    {
      isOpen: open,
      onClose: () => setOpen(false),
      placement: "bottom-start",
      content: h("div.editor-action-form", [
        h(action.detailsForm as any, { state, setState }),
        h(Button, {
          intent: action.intent ?? "primary",
          icon: "play",
          text: "Run",
          fill: true,
          disabled: !ready,
          onClick() {
            run(state);
            setOpen(false);
          },
        }),
      ]),
    },
    button,
  );
}
