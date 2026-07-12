import { useHotkeys } from "@blueprintjs/core";
import {
  Column,
  Region,
  RegionCardinality,
  RowHeaderCell,
  Table,
  TableProps,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { LoadProgressIndicator } from "./components";
import { renderColumnHeaderCell } from "./renderers";
import h from "./main.module.sass";
import {
  columnSpecAtom,
  ctx,
  dataProviderAtom,
  DataSheetProvider,
  storeAtom,
  tableActionsAtom,
  useResolvedProvider,
  useSelector,
  useStoreAPI,
} from "./provider";
import { atom } from "jotai";
import {
  DataSheetProviderProps,
  DEFAULT_ROW_STATUS_STYLES,
  EditEvent,
  RowHeaderRenderContext,
  RowStatusStyles,
  TableElementStatus,
  VisibleCells,
} from "./types.ts";
import { basicCellRenderer } from "./cell-renderer.ts";
import {
  CellRendererDebugOverlay,
  tableHotkeysAtom,
  type ColumnSpec,
} from "./utils";
import {
  ActionsToolbar,
  clipboardActions,
  columnControlActions,
  createSaveAction,
  FilterBar,
  resetChangesAction,
  TableAction,
  TableActionContext,
  TableFilter,
} from "./actions";
import {
  createLocalProvider,
  dataRefreshTokenAtom,
  FetchData,
  FetchDataOptions,
  tableFooterAtom,
  TableDataProvider,
  useScrollHandler,
  useDataLoader,
} from "./postgrest-table";

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

interface DataSheetInternalProps<T> extends TableProps, FetchDataOptions {
  /** In-memory rows. Internally wrapped in a local `TableDataProvider` and
   * driven through the same loader as any other source. */
  data?: T[];
  /** Passed through from the public props so a function form can be derived
   * from the loaded rows here (a static array is handled by the provider). */
  columnSpec?: ColumnSpec[] | ((rows: T[]) => ColumnSpec[]);
  // function to fetch a chunk of data (the read side of a data provider)
  fetchData?: FetchData<T>;
  /** A data provider instantiated separately and passed in — bundles the read
   * side (`fetchData` + `identity`) and, optionally, the persistence side
   * (`saveRows` / `deleteRows` / `insertRow`) that drives the Save action. An
   * explicit alternative to the loose `data` / `fetchData` / `identity` props;
   * takes precedence when given. */
  provider?: TableDataProvider<T>;
  // An optional table name that will be used in toolbars if given
  name?: string;
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
  /** Row identity for the edit overlay — stable across a provider re-sort (a
   * data provider supplies its own; defaults to `(row) => row?.id`). Lets edits
   * survive a re-ordered re-fetch. */
  identity?: (row: T) => string | number | null | undefined;
  /** Derive the controlled edit overlay from the loaded rows, *inside* the
   * sheet. For provider-backed tables whose overlay is a function of the loaded
   * data plus external edit state (e.g. an ops stack): the library owns the
   * rows, so it calls this with them and uses the result as the controlled
   * overlay, re-deriving when the rows — or this function's identity (close it
   * over your edit state) — change. Supersedes `updatedData`/`rowStatus`. */
  deriveOverlay?: (rows: T[]) => {
    updatedData: T[];
    rowStatus: TableElementStatus[];
  };
  /** Bump to force the data provider to re-fetch from scratch (e.g. after a
   * save/delete that invalidated the loaded rows). */
  refreshToken?: number | string;
  /** Persistence handler for the built-in Save action. When provided, a Save
   * control is added to the toolbar (always visible, disabled when there are
   * no pending changes). */
  onSave?: (ctx: TableActionContext<T>) => void | Promise<void>;
  onDeleteRows?: (selection: Region[]) => void;
  verbose?: boolean;
  enableColumnReordering?: boolean;
  enableClipboard?: boolean;
  enableFocusedCell?: boolean;
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
  /** Arbitrary nodes for the bottom status bar (left group), rendered beside
   * the active sort/filter tags — the home for view-state controls (show/hide
   * omitted rows/columns, a group-by indicator, etc.). */
  statusBar?: ReactNode;
  /** Presentation per row-status value, merged over the built-in defaults
   * (which style `"deleted"`). Supply styles for consumer-defined statuses
   * (e.g. `"omitted"`) and/or override the defaults. Each entry may set the
   * cells' style/intent and the row header's style. */
  rowStatusStyles?: RowStatusStyles;
  /** Render the content of a row's header cell (the left gutter). Receives the
   * row, its status, and the default 1-based label; return a node to use, or a
   * nullish value to keep the default. For group-key labels, omit indicators,
   * etc. Header-cell *styling* still comes from `rowStatusStyles`. */
  rowHeaderRenderer?: (ctx: RowHeaderRenderContext<T>) => ReactNode;
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

  // Resolve the data source ONCE, here in the wrapper (not per-render inside
  // `_DataSheet`): an explicit `provider` wins; else a loose `fetchData`
  // (+ identity) is wrapped as one; else in-memory `data` becomes a local
  // provider. Held in the provider layer via `dataProviderAtom` (see
  // `DataSheetProviderInner`), so the loader and store read it. Shared with
  // `DataPanel` / `DataView` via `useResolvedProvider`.
  const { data: _data, dataProvider } = useResolvedProvider<T>(props);

  return h(
    DataSheetProvider<T>,
    {
      data: _data,
      columnSpec,
      columnSpecOptions,
      enableColumnReordering,
      defaultColumnWidth,
      editable,
      dataProvider,
      ...rest,
    },
    h(_DataSheet<any>, {
      ...rest,
      data: _data,
      columnSpec,
      children,
      editable,
      enableColumnReordering,
      enableFocusedCell,
    }),
  );
}

/** Persist all pending changes through a data provider: added rows via
 * `insertRow`, edited rows via `saveRows`, deleted rows via `deleteRows`
 * (addressed by `provider.identity`). Used by the built-in Save action when an
 * explicit provider owns persistence. */
async function persistViaProvider<T>(
  provider: TableDataProvider<T>,
  ctx: TableActionContext<T>,
): Promise<void> {
  const base = (ctx.data ?? []) as any[];
  const updates = (ctx.updatedData ?? []) as any[];
  const status = (ctx.rowStatus ?? []) as any[];
  const n = Math.max(base.length, updates.length, status.length);
  const toSave: T[] = [];
  const toInsert: T[] = [];
  const toDelete: Array<string | number> = [];
  for (let i = 0; i < n; i++) {
    if (status[i] === TableElementStatus.DELETED) {
      const id = provider.identity(base[i]);
      if (id != null) toDelete.push(id);
      continue;
    }
    const upd = updates[i];
    const hasEdit =
      upd != null && typeof upd === "object" && Object.keys(upd).length > 0;
    if (status[i] === TableElementStatus.ADDED) {
      toInsert.push({ ...base[i], ...upd } as T);
    } else if (hasEdit) {
      toSave.push({ ...base[i], ...upd } as T);
    }
  }
  if (toDelete.length > 0 && provider.deleteRows != null) {
    await provider.deleteRows(toDelete);
  }
  for (const row of toInsert) {
    if (provider.insertRow != null) await provider.insertRow(row);
  }
  if (toSave.length > 0 && provider.saveRows != null) {
    await provider.saveRows(toSave);
  }
}

/** The table (cell-grid) renderer. Assumes it is rendered inside a
 * `DataSheetProvider` (the `DataSheet` wrapper, or `DataView`). Exported so a
 * shared-store `DataView` can mount it directly alongside `_DataPanel`. */
export function _DataSheet<T>({
  data: sourceData,
  fetchData,
  provider,
  pageSize,
  fetchMode,
  onVisibleCellsChange,
  onUpdateData,
  onEdit,
  onSave,
  updatedData: updatedDataProp,
  rowStatus: rowStatusProp,
  identity,
  deriveOverlay,
  refreshToken,
  onDeleteRows,
  name,
  verbose = false,
  enableFocusedCell,
  autoFocusEditor = true,
  cellInteraction,
  enableClipboard = true,
  density = DataSheetDensity.HIGH,
  selectionModes,
  actions,
  filters,
  columnHeaderCellRenderer,
  columnSpec: columnSpecProp,
  statusBar,
  rowStatusStyles,
  rowHeaderRenderer,
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

  // The active data source is resolved in the wrapper (`DataSheet`) and held in
  // the provider layer; read it here rather than resolving per render.
  const { provider: activeProvider, isLocalProvider } =
    ctx.useValue(dataProviderAtom);

  // When an explicit provider owns persistence, its methods drive the built-in
  // Save (batch: edits→saveRows, added→insertRow, deleted→deleteRows), then a
  // refresh. Otherwise the loose `onSave` handler is used.
  const bumpRefresh = ctx.useSet(dataRefreshTokenAtom);
  const providerSave = useMemo(() => {
    const p = provider;
    if (
      p == null ||
      (p.saveRows == null && p.deleteRows == null && p.insertRow == null)
    ) {
      return null;
    }
    return async (actionCtx: TableActionContext<T>) => {
      await persistViaProvider(p, actionCtx);
      bumpRefresh((v) => v + 1);
    };
  }, [provider, bumpRefresh]);
  const saveHandler = onSave ?? providerSave;

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
      if (saveHandler != null) add([createSaveAction(saveHandler)]);
      add([resetChangesAction]);
    }
    return _actions;
  }, [actions, enableClipboard, editable, saveHandler]);

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
    () =>
      columnSpec.some(
        (col) =>
          col.sortable ||
          col.filterable ||
          (Array.isArray(col.filters) && col.filters.length > 0),
      ),
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
    // next render when the caller passes an updated value back. When the caller
    // controls it, the loader-boundary identity remap steps aside.
    const controlled =
      updatedDataProp !== undefined ||
      rowStatusProp !== undefined ||
      deriveOverlay != null;
    const patch: Record<string, unknown> = { controlledOverlay: controlled };
    if (updatedDataProp !== undefined) patch.updatedData = updatedDataProp;
    if (rowStatusProp !== undefined) patch.rowStatus = rowStatusProp;
    storeState.setState(patch);
  }, [storeState, updatedDataProp, rowStatusProp, deriveOverlay]);

  // Derived controlled overlay: the library owns the loaded rows, so it runs
  // the consumer's `deriveOverlay(rows)` here and pushes the result. Re-derives
  // when the rows load/change or the function's identity changes (close it over
  // your external edit state). The `controlledOverlay` flag above suppresses the
  // loader-boundary identity remap so this derivation is authoritative.
  const loadedData = useSelector((state) => state.data);
  useEffect(() => {
    if (deriveOverlay == null) return;
    const overlay = deriveOverlay(loadedData);
    storeState.setState({
      updatedData: overlay.updatedData,
      rowStatus: overlay.rowStatus,
    });
  }, [deriveOverlay, loadedData, storeState]);

  // Function `columnSpec`: derive the spec from the loaded rows (no separate
  // fetch of sample data). Derive once the first rows arrive, and re-derive
  // when the function's identity changes (a consumer memoizes it over its
  // own view state — hidden columns, order, overrides). Not re-run as more
  // rows page in (guarded by the function identity), so it never clobbers
  // in-store column state on scroll.
  const derivedSpecFor = useRef<unknown>(null);
  useEffect(() => {
    if (typeof columnSpecProp !== "function") return;
    if (derivedSpecFor.current === columnSpecProp) return;
    const rows = loadedData.filter((r) => r != null);
    if (rows.length === 0) return;
    derivedSpecFor.current = columnSpecProp;
    storeState.setState({ columnSpec: columnSpecProp(rows) });
  }, [columnSpecProp, loadedData, storeState]);

  // The active provider supplies the row identity for the edit overlay.
  useEffect(() => {
    const id = activeProvider?.identity ?? identity;
    if (id != null) storeState.setState({ identity: id });
  }, [storeState, activeProvider, identity]);

  // Row deletion is a provider capability: an explicit `provider` without
  // `deleteRows` disables deletion entirely. (Local / loose sources keep the
  // local delete overlay.)
  useEffect(() => {
    const canDeleteRows = provider == null || provider.deleteRows != null;
    storeState.setState({ canDeleteRows });
  }, [storeState, provider]);

  // Merge consumer `rowStatusStyles` over the built-in defaults and hand the
  // result to the store, where the cell renderer and row-header renderer read
  // it. Merged (not replaced) so overriding one status doesn't drop the rest.
  const mergedRowStatusStyles = useMemo<RowStatusStyles>(
    () => ({ ...DEFAULT_ROW_STATUS_STYLES, ...rowStatusStyles }),
    [rowStatusStyles],
  );
  useEffect(() => {
    storeState.setState({ rowStatusStyles: mergedRowStatusStyles });
  }, [storeState, mergedRowStatusStyles]);

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
      // The active filter for this column is whichever active filter targets
      // it (a rich `col.filters` filter or the generic operator filter) — match
      // by columnKey rather than a fixed id.
      for (const entry of activeFilters?.values() ?? []) {
        if ((entry as any)?.filter?.columnKey === col.key) {
          activeFilter = entry;
          break;
        }
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
      const statusVal = rowStatus[dataRowIndex];
      const style =
        (statusVal != null
          ? mergedRowStatusStyles[statusVal]?.headerStyle
          : null) ?? null;

      const defaultLabel = `${dataRowIndex + 1}`;
      let name: ReactNode = defaultLabel;
      if (rowHeaderRenderer != null) {
        const custom = rowHeaderRenderer({
          rowIndex: dataRowIndex,
          visibleIndex: rowIndex,
          row: data[dataRowIndex] ?? updatedData[dataRowIndex],
          status: statusVal,
          isDeleted: statusVal === TableElementStatus.DELETED,
          defaultLabel,
        });
        if (custom != null) name = custom;
      }

      return h(RowHeaderCell, {
        enableRowReordering: false,
        index: rowIndex,
        name,
        style,
      });
    },
    [
      rowStatus,
      filteredRowIndices,
      mergedRowStatusStyles,
      rowHeaderRenderer,
      data,
      updatedData,
    ],
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

  // Drive the table from the active provider's `fetchData`. A local (in-memory)
  // provider loads the whole array at once; a remote one uses the `pageSize` /
  // `fetchMode` props and shows load progress.
  let _showLoadProgress: boolean = false;
  let dataLoader: ReactNode = null;
  if (activeProvider != null) {
    _showLoadProgress = !isLocalProvider;
    dataLoader = h(_DataLoaderManager, {
      key: "__data_loader",
      fetchData: activeProvider.fetchData,
      pageSize: isLocalProvider
        ? Math.max(sourceData?.length ?? 1, 1)
        : pageSize,
      fetchMode: isLocalProvider ? undefined : fetchMode,
    });
  }
  const showFilterBar =
    (filters != null && filters.length > 0) || hasSortableOrFilterable;

  let filterStatus: ReactNode = null;
  if (showFilterBar) {
    filterStatus = h(FilterBar, { filters: filters ?? [] });
  }

  return h("div.data-sheet-container", { className, style }, [
    // The actions/tools toolbar (selection-modal). Table-scoped controls like
    // scroll-to-row / full-text search live here as ordinary actions.
    h(ActionsToolbar, { actions: _actions, tableName: name }),
    dataLoader,
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
    h("div.status-bar", [
      filterStatus,
      statusBar,
      h("div.spacer"),
      h.if(_showLoadProgress)(LoadProgressIndicator),
    ]),
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

/** Convenience component: runs `useChunkLoader` from inside a `DataSheet`.
 * Render as a child of `DataSheet` (it renders nothing itself). */
function _DataLoaderManager<T = any>({
  fetchData,
  ...rest
}: {
  fetchData: FetchData<T>;
} & FetchDataOptions) {
  useDataLoader(fetchData, rest);
  return null;
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
