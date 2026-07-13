import { useHotkeys } from "@blueprintjs/core";
import {
  Column,
  RegionCardinality,
  RowHeaderCell,
  Table,
} from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { LoadProgressIndicator } from "./components";
import { basicCellRenderer, renderColumnHeaderCell } from "./renderers";
import h from "./main.module.sass";
import {
  columnSpecAtom,
  ctx,
  dataProviderAtom,
  dataRefreshTokenAtom,
  DataSheetProvider,
  DEFAULT_ROW_STATUS_STYLES,
  FetchData,
  persistViaProvider,
  RowStatusStyles,
  storeAtom,
  TableActionContext,
  tableActionsAtom,
  TableElementStatus,
  useResolvedProvider,
  useSelector,
  useStoreAPI,
  VisibleCells,
} from "./provider";
import { atom } from "jotai";
import { CellRendererDebugOverlay, tableHotkeysAtom } from "./utils";
import {
  ActionsToolbar,
  clipboardActions,
  columnControlActions,
  createSaveAction,
  FilterBar,
  resetChangesAction,
  TableAction,
} from "./actions";
import {
  tableFooterAtom,
  useDataLoader,
  useScrollHandler,
} from "./postgrest-table";
import {
  CellInteraction,
  DataSheetDensity,
  DataSheetInternalProps,
  DataSheetProps,
  FetchDataOptions,
} from "./types.ts";
import { ErrorCallout } from "@macrostrat/ui-components";

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

// TODO: add a "copy to selection" tool (the little square in the bottom right corner of a cell)
// This should copy the value of a cell (or a set of cells in the same row) downwards.

/** Approximate column-header + scrollbar allowance, used to size the table to
 * its content in paged mode. */
const COLUMN_HEADER_HEIGHT = 34;

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
    h(DataSheetRenderer<any>, {
      ...rest,
      children,
      editable,
      enableColumnReordering,
      enableFocusedCell,
    }),
  );
}

/** The table (cell-grid) renderer. Assumes it is rendered inside a
 * `DataSheetProvider` (the `DataSheet` wrapper, or `DataView`). Exported so a
 * shared-store `DataView` can mount it directly alongside `_DataPanel`. */
export function DataSheetRenderer<T>({
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
  // Identity/canDeleteRows sync (was here) is now handled by the provider
  // (`DataSheetProviderInner`); still destructured so `identity`/`refreshToken`
  // don't leak into `...rest` (spread onto the Blueprint `Table` below).
  identity: _identity,
  deriveOverlay,
  refreshToken: _refreshToken,
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
  const {
    provider: activeProvider,
    isLocalProvider,
    localCount,
  } = ctx.useValue(dataProviderAtom);

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

  // Function `columnSpec` derivation is hoisted to the provider
  // (`DataSheetProviderInner`), shared by both renderers.

  // Identity and canDeleteRows sync are hoisted to the provider
  // (`DataSheetProviderInner`), shared with `_DataPanel` — both depend only on
  // the resolved data provider, not any sheet-specific state.

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

  // Done with hooks!
  /** Guard for unacceptable state combinations:
   * editable = true requires selectionModes to include cells, else the user cannot select a cell to edit.
   * TODO: make this an impossible state to enter.
   */
  if (
    editable &&
    selectionModes &&
    !selectionModes.includes(RegionCardinality.CELLS)
  ) {
    return h(ErrorCallout, {
      title: "Invalid selection mode",
      description: "Editable sheet requires cell selection",
    });
  }

  // TODO: hoist this
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
    // A local (in-memory) source loads all its rows in one page; its count
    // rides on the resolved provider (`localCount`), so `_DataSheet` no longer
    // takes a `data` prop — live rows come only from the store.
    dataLoader = h(_DataLoaderManager, {
      key: "__data_loader",
      fetchData: activeProvider.fetchData,
      pageSize: isLocalProvider ? Math.max(localCount, 1) : pageSize,
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
