import {
  Button,
  HotkeysProvider,
  InputGroup,
  OverlaysProvider,
  useHotkeys,
} from "@blueprintjs/core";
import {
  Column,
  Region,
  RegionCardinality,
  RowHeaderCell,
  Table,
  TableProps,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DataSheetAction, InfoBar, LoadProgressIndicator } from "./components";
import {
  autoFilterId,
  renderColumnHeaderCell,
  SortFilterBar,
} from "./renderers";
import h from "./main.module.sass";
import {
  columnSpecAtom,
  DataSheetProvider,
  storeAtom,
  useSelector,
  useStoreAPI,
  ctx,
  tableActionsAtom,
} from "./provider";
import { atom } from "jotai";
import {
  DataSheetProviderProps,
  EditEvent,
  TableElementStatus,
  VisibleCells,
} from "./types.ts";
import { basicCellRenderer } from "./cell-renderer.ts";
import { tableHotkeysAtom } from "./utils";
import {
  clipboardActions,
  columnControlActions,
  createSaveAction,
  resetChangesAction,
  TableAction,
  TableActionContext,
  TableFilter,
} from "./actions";
import { ActionsToolbar, FilterBar } from "./actions";
import { useScrollHandler, tableFooterAtom } from "./postgrest-table";

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

export enum DataSheetDensity {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/** Approximate column-header + scrollbar allowance, used to size the table to
 * its content in paged mode. */
const COLUMN_HEADER_HEIGHT = 34;

/**
 * How selecting a cell activates its surface (an editor, or a read-only detail
 * panel):
 * - `"auto"` (default when `autoFocusEditor` is `true`): open the surface on
 *   selection and, for editors, focus it. Editors relinquish focus at their
 *   edges — arrow past the start/end of a text cell, or press Escape, and focus
 *   returns to the table — so the keyboard stays operable without the mouse.
 *   Pressing Escape drops into navigation mode (surfaces stop auto-opening)
 *   until the next click.
 * - `"manual"` (default when `autoFocusEditor` is `false`): the surface stays
 *   closed until the cell is clicked; arrow keys always navigate the table.
 */
export type CellInteraction = "auto" | "manual";

interface DataSheetInternalProps<T> extends TableProps {
  onVisibleCellsChange?: (visibleCells: VisibleCells) => void;
  onUpdateData?: (updatedData: any[], data: T[]) => void;
  /** Observer called for every user edit as a structured `EditEvent`
   * (Workstream A). Additive: the built-in `updatedData` overlay still
   * applies. */
  onEdit?: (event: EditEvent<T>) => void;
  /** Controlled edited-cell overlay (Workstream A). When provided, it is
   * synced into the store as the source of truth for edited values — pair with
   * `onEdit` to own edit state externally (e.g. an ops model). Optimistic
   * in-table edits are superseded by the next value you pass back. */
  updatedData?: T[];
  /** Controlled row-status overlay (edited / added / deleted), the companion
   * to `updatedData`. */
  rowStatus?: TableElementStatus[];
  /** Persistence handler for the built-in Save action. When provided, a Save
   * control is added to the toolbar (always visible, disabled when there are
   * no pending changes). */
  onSave?: (ctx: TableActionContext<T>) => void | Promise<void>;
  onDeleteRows?: (selection: Region[]) => void;
  verbose?: boolean;
  enableColumnReordering?: boolean;
  enableClipboard?: boolean;
  enableFocusedCell?: boolean;
  dataSheetActions?: ReactNode | null;
  editable?: boolean;
  /** @deprecated Prefer `cellInteraction`. `true` maps to `"auto"`,
   * `false` to `"manual"`. */
  autoFocusEditor?: boolean;
  /** How selecting a cell activates its surface (editor or detail panel).
   * Defaults from `autoFocusEditor` for backward compatibility. */
  cellInteraction?: CellInteraction;
  density?: DataSheetDensity;
  /** Configurable table actions shown in a selection-aware toolbar.
   * When provided, the actions toolbar renders alongside the existing
   * edit toolbar. Actions are filtered by the current selection cardinality. */
  actions?: TableAction<T>[];
  /** Available column/table filters shown in a filter bar.
   * Filters can also be defined per-column via `ColumnSpec.filters`. */
  filters?: TableFilter<T>[];
  /** Optional custom column header cell renderer, called for each column.
   * Receives the ColumnSpec and column index; should return a React element
   * (typically a Blueprint ColumnHeaderCell). */
  columnHeaderCellRenderer?: (col: any, colIndex: number) => ReactNode;
}

type DataSheetProps<T> = DataSheetProviderProps<T> & DataSheetInternalProps<T>;

const emptyData: any[] = [];

export function DataSheet<T>(props: DataSheetProps<T>) {
  const {
    data,
    columnSpec,
    columnSpecOptions,
    editable = true,
    enableColumnReordering = false,
    enableFocusedCell = false,
    defaultColumnWidth = 150,
    children,
    ...rest
  } = props;

  return h(
    DataSheetProvider<T>,
    {
      data: data ?? emptyData,
      columnSpec,
      columnSpecOptions,
      enableColumnReordering,
      defaultColumnWidth,
      editable,
      ...rest,
    },
    h(_DataSheet<any>, {
      ...rest,
      children,
      editable,
      enableColumnReordering,
      enableFocusedCell,
    }),
  );
}

const deletedRowHeaderStyle = {
  opacity: 0.5,
  textDecoration: "line-through",
};

function _DataSheet<T>({
  onVisibleCellsChange,
  onUpdateData,
  onEdit,
  onSave,
  updatedData: updatedDataProp,
  rowStatus: rowStatusProp,
  onDeleteRows,
  verbose = false,
  dataSheetActions = null,
  enableFocusedCell,
  autoFocusEditor = true,
  cellInteraction,
  enableClipboard = true,
  showInfoBar = false,
  showLoadProgress = false,
  density = DataSheetDensity.HIGH,
  selectionModes,
  actions,
  filters,
  columnHeaderCellRenderer,
  children,
  ...rest
}: DataSheetInternalProps<T>) {
  /**
   * @param data: The data to be displayed in the table
   * @param columnSpec: The specification for all columns in the table. If not provided, the column spec will be generated from the data.
   * @param columnSpecOptions: Options for generating a column spec from data
   */

  // Turn on debug features
  const debugMode = false;

  const editable = useSelector((state) => state.editable);

  // Sync table actions to atom. Consumer actions come first (they override a
  // built-in by reusing its id); the built-in column controls (sort/filter)
  // fill in the rest — so both the toolbar and the header dropdown source from
  // one registry. Built-ins self-gate (single sortable/filterable column).
  const _actions: TableAction[] = useMemo(() => {
    const _actions: TableAction[] = [];
    const add = (list: TableAction[]) => {
      for (const a of list) {
        if (!_actions.some((x) => x.id === a.id)) _actions.push(a);
      }
    };
    if (actions != null) add(actions);
    add(columnControlActions);
    if (enableClipboard) add(clipboardActions);
    // Save/reset last — they're the most significant actions — and present for
    // every cardinality (editable), so the toolbar stays mounted regardless of
    // selection.
    if (editable) {
      if (onSave != null) add([createSaveAction(onSave)]);
      add([resetChangesAction]);
    }
    return _actions;
  }, [actions, enableClipboard, editable, onSave]);

  ctx.useSync(tableActionsAtom, _actions);

  const hotkeysConfig = ctx.useValue(tableHotkeysAtom);
  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeysConfig);

  // For now, we only consider a single cell "focused" when we have one cell selected.
  // Multi-cell selections have a different set of "bulk" actions.
  const selectedRegions = useSelector<T>((state) => state.selection ?? []);

  const data = useSelector((state) => state.data);

  const rowStatus = useSelector((state) => state.rowStatus);

  const focusedCell = useSelector((state) => state.focusedCell);

  const ref = useSelector((state) => state.tableRef);

  const columnSpec = useSelector((state) => state.columnSpec);

  // A sparse array to hold updates
  // TODO: create a "changeset" concept to facilitate undo/redo
  const updatedData = useSelector((state) => state.updatedData);

  const onSelection = useSelector((state) => state.onSelection);

  const storeAPI = useStoreAPI<T>();

  const onScroll = useScrollHandler();
  const _onVisibleCellsChange = useCallback(
    (visibleCells: VisibleCells) => {
      onScroll(visibleCells);
      onVisibleCellsChange?.(visibleCells);
    },
    [onVisibleCellsChange, onScroll],
  );

  useEffect(() => {
    if (!verbose) return;
    console.log("Updated data", updatedData);
  }, [updatedData]);

  useEffect(() => {
    onUpdateData?.(updatedData, data);
  }, [onUpdateData, data, updatedData]);

  useEffect(() => {
    if (!verbose) return;
    console.log("Selected regions", selectedRegions);
  }, [selectedRegions]);

  const tableElementRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Return the focus to the table
    tableElementRef.current?.focus();
  }, [focusedCell]);

  const columnWidths = ctx.useValue(columnWidthsAtom);

  // When filters are active, only show matching rows
  const filteredRowIndices = useSelector((state) => state.filteredRowIndices);
  const totalRows = Math.max(updatedData.length, data.length);
  const numRows =
    filteredRowIndices != null ? filteredRowIndices.length : totalRows;

  let className = `${density}-density`;

  const { rowHeight, style } = styleParamsForDensity(density);

  // In paged mode the row count is small and fixed, so let the table size to
  // its content (header + rows) instead of filling the viewport.
  const footerInfo = ctx.useValue(tableFooterAtom);
  const holderStyle =
    footerInfo.mode === "paged"
      ? {
          flex: "0 0 auto" as const,
          height: numRows * rowHeight + COLUMN_HEADER_HEIGHT,
        }
      : undefined;

  const onColumnsReordered = useSelector((state) => state.onColumnsReordered);

  // Auto-detect if any columns have sortable/filterable set.
  // If so and no explicit columnHeaderCellRenderer was provided,
  // use the built-in client-side sort/filter header.
  const hasSortableOrFilterable = useMemo(
    () => columnSpec.some((col) => col.sortable || col.filterable),
    [columnSpec],
  );

  const columnSorts = useSelector((state) => state.columnSorts);
  const activeFilters = useSelector((state) => state.activeFilters);

  // Cell activation mode, defaulting from the legacy `autoFocusEditor` boolean
  // so existing consumers are unaffected. Synced into the store so the cell
  // renderer, editors, and key handlers all read it consistently.
  const cellInteractionMode: CellInteraction =
    cellInteraction ?? (autoFocusEditor ? "auto" : "manual");

  const storeState = storeAPI;
  useEffect(() => {
    storeState.setState({ cellInteraction: cellInteractionMode });
  }, [storeState, cellInteractionMode]);

  useEffect(() => {
    // Give the store a handle to the focusable holder so editors can return
    // keyboard focus to the table when the cursor leaves them.
    storeState.setState({ tableElement: tableElementRef.current });
  }, [storeState]);

  useEffect(() => {
    storeState.setState({ onEdit });
  }, [storeState, onEdit]);

  useEffect(() => {
    // Controlled overlay: mirror the caller's edited state into the store as
    // the source of truth. Optimistic in-table edits are superseded on the
    // next render when the caller passes an updated value back.
    const patch: Record<string, unknown> = {};
    if (updatedDataProp !== undefined) patch.updatedData = updatedDataProp;
    if (rowStatusProp !== undefined) patch.rowStatus = rowStatusProp;
    if (Object.keys(patch).length > 0) storeState.setState(patch);
  }, [storeState, updatedDataProp, rowStatusProp]);

  const realizedColumns = useMemo(() => {
    return columnSpec.map((col, colIndex) => {
      let fn =
        col.headerCellRenderer ??
        columnHeaderCellRenderer ??
        renderColumnHeaderCell;
      let activeSort = null;
      let activeFilter = null;
      if (col.sortable) {
        activeSort = columnSorts?.find((s) => s.key === col.key);
      }
      if (col.filterable) {
        // The autoFilterID implementation is too complicated
        activeFilter =
          activeFilters?.get(col.key) ??
          activeFilters?.get(autoFilterId(col.key));
      }

      const _columnHeaderCellRenderer = (colIndex) => {
        return fn({
          col,
          colIndex,
          activeSort,
          activeFilter,
        });
      };

      return h(Column, {
        id: col.key,
        name: col.name,
        columnHeaderCellRenderer: _columnHeaderCellRenderer,
        cellRenderer: (rowIndex) => {
          const state = storeAPI.getState();
          return basicCellRenderer<T>(
            rowIndex,
            colIndex,
            col,
            state,
            filteredRowIndices,
          );
        },
      });
    });
  }, [
    columnSpec,
    columnSorts,
    activeFilters,
    storeAPI,
    filteredRowIndices,
    columnHeaderCellRenderer,
  ]);

  const onColumnWidthChanged = useSelector(
    (state) => state.onColumnWidthChanged,
  );

  const rowHeaderCellRenderer = useCallback(
    (rowIndex: number) => {
      const dataRowIndex =
        filteredRowIndices != null
          ? (filteredRowIndices[rowIndex] ?? rowIndex)
          : rowIndex;
      const style =
        rowStatus[dataRowIndex] == TableElementStatus.DELETED
          ? deletedRowHeaderStyle
          : null;

      return h(RowHeaderCell, {
        enableRowReordering: false,
        index: rowIndex,
        name: `${dataRowIndex + 1}`,
        style,
      });
    },
    [rowStatus, filteredRowIndices],
  );

  let _selectionModes = selectionModes;
  if (
    editable &&
    _selectionModes != null &&
    !_selectionModes.includes(RegionCardinality.CELLS)
  ) {
    _selectionModes = [..._selectionModes, RegionCardinality.CELLS];
    // Ensure selection mode includes "cells"
  }

  const cellRendererDependencies = [
    data,
    updatedData,
    focusedCell,
    rowStatus,
    filteredRowIndices,
  ];

  return h("div.data-sheet-container", { className, style }, [
    // Global sort/filter status bars sit above the (selection-modal)
    // actions/tools toolbar.
    h.if(filters != null && filters.length > 0)(FilterBar, { filters }),
    h.if(hasSortableOrFilterable)(SortFilterBar),
    // Rendered from the merged action set (built-ins included) so it reflects
    // sort/filter/save/reset even without a consumer `actions` prop; it
    // self-gates (renders nothing when no action applies).
    h(ActionsToolbar, { actions: _actions }),
    dataSheetActions,
    children,
    h(
      "div.data-sheet-holder",
      {
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        onKeyUp: handleKeyUp,
        ref: tableElementRef,
        style: holderStyle,
      },
      h(
        Table,
        {
          ref,
          numRows,
          className: "data-sheet",
          enableFocusedCell,
          onColumnsReordered,
          focusedCell,
          selectedRegions,
          defaultRowHeight: rowHeight,
          minRowHeight: rowHeight,
          columnWidths,
          onColumnWidthChanged,
          onSelection,
          /** TODO: we could enable this, but we need a use-case first... */
          enableRowReordering: false,
          enableRowResizing: false,
          // The cell renderer is memoized internally based on these data dependencies
          cellRendererDependencies,
          onVisibleCellsChange: _onVisibleCellsChange,
          rowHeaderCellRenderer,
          selectionModes: _selectionModes,
          ...rest,
          getCellClipboardData: null,
        },
        realizedColumns,
      ),
    ),
    h.if(showInfoBar)(InfoBar),
    h.if(showLoadProgress)(LoadProgressIndicator),
    h.if(debugMode)(CellRendererDebugOverlay, {
      cellRendererDependencies,
      names: [
        "data",
        "updatedData",
        "focusedCell",
        "rowStatus",
        "filteredRowIndices",
      ],
    }),
  ]);
}

const columnWidthsIndexAtom = atom((get) => get(storeAtom).columnWidthsIndex);
const defaultColumnWidthAtom = atom((get) => get(storeAtom).defaultColumnWidth);

const columnWidthsAtom = atom((get) => {
  const ix = get(columnWidthsIndexAtom);
  return get(columnSpecAtom).map(
    (col) => ix.get(col.key) ?? col.width ?? get(defaultColumnWidthAtom),
  );
});

function CellRendererDebugOverlay({ cellRendererDependencies, names }) {
  /** Debug overlay for cell renderer dependencies */
  const lastRenderDependencies = useRef<any[]>(cellRendererDependencies);
  useEffect(() => {
    let changeDepNames = [];
    for (const [i, dep] of cellRendererDependencies.entries()) {
      if (dep !== lastRenderDependencies.current[i]) {
        changeDepNames.push(names[i]);
      }
    }
    if (changeDepNames.length > 0) {
      console.log(
        "Cell renderer dependencies changed:",
        changeDepNames.join(", "),
      );
    }
    lastRenderDependencies.current = cellRendererDependencies;
  }, cellRendererDependencies);
  return null;
}

export function ScrollToRowControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((state) => state.scrollToRow);

  return h(DataSheetAction, [
    h(InputGroup, {
      type: "number",
      placeholder: "Row number",
      value,
      onValueChange(value) {
        setValue(value);
      },
    }),
    h(
      Button,
      {
        icon: "arrow-right",
        onClick() {
          const row = parseInt(value);
          scrollToRow(row - 1);
        },
      },
      "Scroll to row",
    ),
  ]);
}

function styleParamsForDensity(density: DataSheetDensity) {
  switch (density) {
    case DataSheetDensity.MEDIUM:
      return {
        rowHeight: 24,
        style: {
          "--data-sheet-row-height": "24px",
          "--data-sheet-font-size": "14px",
        },
      };
    case DataSheetDensity.LOW:
      return {
        rowHeight: 30,
        style: {
          "--data-sheet-row-height": "30px",
          "--data-sheet-font-size": "18px",
        },
      };
    case DataSheetDensity.HIGH:
    default:
      return {
        rowHeight: 20,
        style: {
          "--data-sheet-row-height": "20px",
          "--data-sheet-font-size": "12px",
        },
      };
  }
}

export function getRowsToDelete(selection) {
  let rowIndices: number[] = [];
  for (const sel of selection) {
    // This isn't a full-row selection
    if (sel.cols != null) continue;
    if (sel.rows == null) continue;
    const [startIndex, endIndex] = sel.rows;
    for (let i = startIndex; i <= endIndex; i++) {
      rowIndices.push(i);
    }
  }
  return rowIndices;
}
