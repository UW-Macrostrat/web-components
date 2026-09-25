/**
 * Row editor — a selection's fields as a form, derived from the column spec:
 * the `DataEditor`'s form (see `data-editor.ts`) over the sheet's selected
 * rows.
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
import { Button, type IconName, NonIdealState } from "@blueprintjs/core";
import { atom } from "jotai";
import { type ReactNode, useMemo, useRef } from "react";
import { type Region, RegionCardinality } from "@blueprintjs/table";
import {
  type CellValidation,
  type ColumnSpec,
  ctx as sheetScope,
  itemLabelAtom,
  pluralize,
  selectionAtom,
  tableActionsAtom,
  useSelector,
  useStoreAPI,
} from "../provider";
import {
  getSelectedColumnKeys,
  getSelectedRowIndices,
  getSelectionCardinality,
} from "../actions/selection.ts";
import type { TableAction } from "../actions";
import {
  DataEditor,
  DataEditorField,
  DataEditorFields,
  DataEditorFrame,
  type DataEditorProps,
  type FieldSpec,
} from "./data-editor";
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

/** The form over one row or several, as the sheet's row editor draws it:
 * `DataEditorFields` in a `DataEditorFrame`, with the sheet's notions of a
 * focus (the columns a cell selection falls in) and an active field. */
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

  return h(DataEditorFrame, { className, panel, title, onClose, closeLabel }, [
    header,
    h(DataEditorFields<T>, {
      dataSpec: columnSpec,
      rows,
      rowEdits,
      rowIndices,
      surface: "row-editor",
      editable,
      onChange,
      onChangeCells,
      onResetField,
      focusFields: focusColumns,
      activeField: activeColumn,
      onFieldClick,
      showHidden,
      hideEmpty,
      inline,
    }),
    children,
  ]);
}

/** The row editor's frame: the data editor's. */
export const RowEditorFrame = DataEditorFrame;

/** A row editor field: the data editor's. */
export const RowEditorField = DataEditorField;

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

/* -------------------------------------------------- selected data editor */

export interface SelectedDataEditorProps<T = any> extends Omit<
  DataEditorProps<T>,
  "dataSpec" | "data" | "onSave"
> {
  /** The fields; defaults to the sheet's column spec. */
  dataSpec?: FieldSpec[];
  /** Persist the edited record. Defaults to the sheet's provider
   * (`rowEditing.saveRows`), which refreshes the rows after. Without either,
   * the editor is a viewer. */
  onSave?: DataEditorProps<T>["onSave"];
  /** Whether the ✕ in the title bar clears the selection (default). */
  closeable?: boolean;
  /** Show the sheet's actions, scoped to the record and its fields (off by
   * default: the sheet's toolbar carries them). */
  showActions?: boolean;
}

/**
 * A `DataEditor` over the one row a sheet's or panel's selection holds: the
 * immediate-edit counterpart of `SelectedRowEditor`, for a view (a `DataPanel`
 * card list) whose edits are saved one record at a time rather than
 * accumulated in the sheet's overlay. It keeps its own pending edits, and
 * Save writes the record through the provider. Several rows selected, or
 * none, it says so.
 */
export function SelectedDataEditor<T = any>(props: SelectedDataEditorProps<T>) {
  const {
    dataSpec,
    onSave,
    closeable = true,
    showActions = false,
    panel = true,
    title,
    editable,
    ...rest
  } = props;
  const store = useStoreAPI();
  const columnSpec = useSelector((s) => s.columnSpec);
  const saveRows = useSelector((s) => s.rowEditing?.saveRows);
  const tableActions = sheetScope.useValue(
    tableActionsAtom,
  ) as TableAction<T>[];
  const itemLabel = sheetScope.useValue(itemLabelAtom);
  const setSelection = sheetScope.useSet(selectionAtom);
  const { rows } = useSelectedRows<T>();
  const count = rows.length;

  if (count !== 1 || rows[0] == null) {
    let noun = pluralize(itemLabel, count);
    let stateTitle = `${count} ${noun} selected`;
    if (count === 0) stateTitle = `No ${noun} selected`;
    return h(
      RowEditorFrame,
      { panel, className: "row-editor-empty" },
      h(NonIdealState, {
        title: stateTitle,
        className: "row-editor-non-ideal",
      }),
    );
  }

  let save = onSave;
  if (save == null && saveRows != null) {
    save = async (value: T) => {
      await saveRows([value]);
    };
  }
  const canEdit = (editable ?? true) && save != null;
  let heading = title;
  if (heading == null) {
    heading = `Viewing 1 ${itemLabel}`;
    if (canEdit) heading = `Editing 1 ${itemLabel}`;
  }
  let onClose: (() => void) | undefined;
  if (closeable) onClose = () => setSelection([]);

  return h(DataEditor<T>, {
    ...rest,
    dataSpec: dataSpec ?? columnSpec,
    data: rows[0] as T,
    onSave: save,
    editable: canEdit,
    panel,
    title: heading,
    onClose,
    closeLabel: "Clear selection",
    actions: tableActions,
    showActions,
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
