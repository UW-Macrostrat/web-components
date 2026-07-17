import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import { Table } from "@blueprintjs/table";
import {
  type ColumnSpec,
  generateColumnSpec,
  postprocessColumnSpec,
} from "./column-spec.ts";
import { splitProps } from "../utils";
import { createScopedStore } from "@macrostrat/data-components";
import {
  DataSheetProviderProps,
  DataSheetState,
  DataSheetStore,
  DS_ROW_ID,
  TableElementStatus,
} from "./types.ts";
import { createZustandStore } from "./zustand-store.ts";
import { atomWithStore } from "jotai-zustand";
import { toasterAtom } from "../notifications.ts";
import { TableAction } from "../actions";
import { atom } from "jotai";
import {
  createLocalProvider,
  dataRefreshTokenAtom,
  FetchData,
  TableDataProvider,
} from "./table-data.ts";
import { ErrorBoundary, ToasterContext } from "@macrostrat/ui-components";
import {
  DataViewRendererType,
  InteractionOptions,
  interactionOptionsAtom,
  interactionOptionsKeys,
  resolveInteractionOptions,
} from "./interactions.ts";
import { DataViewProps } from "../data-view.ts";
import { DataSheetProps } from "../types.ts";
import { DataPanelProps } from "../data-panel.ts";

/** Create a Jotai scoped store */
export const ctx = createScopedStore();

export const storeAPIAtom = atom<StoreApi<DataSheetStore<any>>>();

const storeWrapperAtom = atom((get) => {
  const _storeAPIAtom = get(storeAPIAtom);
  if (_storeAPIAtom == null) {
    return undefined;
  }
  return atomWithStore(_storeAPIAtom);
});

/** This is the basis for all other atoms that manipulate the store. */
export const storeAtom = atom(
  (get) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      return undefined;
    }
    return get(storeWrapper);
  },
  (get, set, action: SetStateAction<any>) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      throw new Error("Missing DataSheetProvider");
    }
    return set(storeWrapper, action);
  },
);

/** Stable empty spec so a function `columnSpec` yields a constant init value
 * (see `DataSheetProviderInner`). */
const EMPTY_SPEC: ColumnSpec[] = [];

const initializeStoreAtom = atom(
  null,
  (get, set, payload: Partial<DataSheetStore<any>>) => {
    set(storeAtom, (state) => {
      return {
        ...state,
        ...payload,
      };
    });
  },
);

export const tableActionsAtom = atom<TableAction[]>([]);

/** The resolved data source for the table, held in the provider layer (next to
 * the store) rather than resolved inside the render loop. `provider` is the
 * unified `TableDataProvider` (explicit, loose-`fetchData`-wrapped, or a local
 * in-memory provider); `isLocalProvider` distinguishes the in-memory case (it
 * loads the whole array at once and shows no load progress). `isExplicitProvider`
 * distinguishes an explicit `provider` object from a loose `fetchData`/`data`
 * source — only an explicit provider without `deleteRows` disables row
 * deletion; loose sources keep the local delete overlay. */
export interface ResolvedDataProvider {
  provider: TableDataProvider<any> | null;
  isLocalProvider: boolean;
  isExplicitProvider: boolean;
  /** Row count of an in-memory (local) source, so a renderer can size the
   * loader's page to "all of it" without also receiving the `data` prop. `0`
   * for non-local sources. */
  localCount: number;
}

const DEFAULT_DATA_PROVIDER: ResolvedDataProvider = {
  provider: null,
  isLocalProvider: true,
  isExplicitProvider: false,
  localCount: 0,
};

export const dataProviderAtom = atom<ResolvedDataProvider>(
  DEFAULT_DATA_PROVIDER,
);

const EMPTY_ARRAY: any[] = [];

/** Resolve a table's data source from the loose `provider` / `fetchData` /
 * `data` props (an explicit `provider` wins; else a loose `fetchData` (+
 * `identity`) is wrapped as one; else in-memory `data` becomes a local
 * provider). Shared by `DataSheet`, `DataPanel`, and `DataView` so all three
 * resolve identically. */
export function useResolvedProvider<T>(props: {
  provider?: TableDataProvider<T>;
  fetchData?: FetchData<T>;
  data?: T[];
  identity?: (row: T) => string | number | null | undefined;
}): {
  data: T[];
  isLocalProvider: boolean;
  activeProvider: TableDataProvider<any> | null;
  dataProvider: ResolvedDataProvider;
} {
  const _data = props.data ?? (EMPTY_ARRAY as T[]);
  const isLocalProvider = props.provider == null && props.fetchData == null;
  const isExplicitProvider = props.provider != null;
  const activeProvider = useMemo<TableDataProvider<any> | null>(() => {
    if (props.provider != null) return props.provider;
    if (props.fetchData != null) {
      return {
        fetchData: props.fetchData,
        identity: props.identity ?? ((r: any) => r?.id),
      } as TableDataProvider<any>;
    }
    if (_data.length > 0) {
      return createLocalProvider(
        _data,
        props.identity != null
          ? { identity: props.identity as (row: any) => string | number }
          : undefined,
      );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.provider, props.fetchData, _data, props.identity]);
  const localCount = isLocalProvider ? _data.length : 0;
  const dataProvider = useMemo(
    () => ({
      provider: activeProvider,
      isLocalProvider,
      isExplicitProvider,
      localCount,
    }),
    [activeProvider, isLocalProvider, isExplicitProvider, localCount],
  );
  return { data: _data, isLocalProvider, activeProvider, dataProvider };
}

function DataSheetStoreWrapper<T>(props: DataSheetProviderProps<T>) {
  const { toaster, ...rest } = props;
  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>(createZustandStore);
  });
  return h(
    ctx.Provider,
    {
      atoms: [
        [storeAPIAtom, store],
        [toasterAtom, toaster],
      ],
    },
    h(DataSheetProviderInner, rest),
  );
}

const tableDataProviderKeys = new Set([
  "provider",
  "fetchData",
  "data",
  "identity",
]);

const dataProviderKeys = new Set([
  "columnSpec",
  "columnSpecOptions",
  "name",
  "itemLabel",
  "enableColumnReordering",
  "defaultColumnWidth",
  "refreshToken",
  "identity",
  "toaster",
  "viewType",
  "interactionOptions",
]);

type AnyDataSheetProps<T> =
  | DataViewProps<T>
  | DataPanelProps<T>
  | DataSheetProps<T>;

export function splitDataProviderProps<T>(props: AnyDataSheetProps<T>) {
  /** Split provided props based on provider's needs */
  return splitProps<AnyDataSheetProps<T>, DataSheetProviderProps<T>>(
    props,
    dataProviderKeys
      .union(interactionOptionsKeys)
      .union(tableDataProviderKeys) as Set<keyof DataSheetProviderProps<T>>,
  );
}

export function DataSheetProvider<T>(
  props: DataSheetProviderProps<T> & { children: React.ReactNode },
) {
  return h(
    ToasterContext,
    h(ErrorBoundary, h(DataSheetStoreWrapper<T>, props)),
  );
}

type DataSheetProviderInnerProps<T> = DataSheetProviderProps<T> & {
  dataProvider?: ResolvedDataProvider;
};

export function DataSheetProviderInner<T>(
  props: DataSheetProviderInnerProps<T>,
) {
  const tableRef = useRef<Table>(null);

  const [interactionOptionsProps, providerProps] = splitProps<
    DataSheetProviderInnerProps<T>,
    InteractionOptions
  >(props, interactionOptionsKeys);
  const interactionOptions = resolveInteractionOptions(
    interactionOptionsProps,
    props.viewType ?? DataViewRendererType.TABLE,
  );

  const {
    children,
    columnSpec,
    columnSpecOptions,
    name,
    itemLabel,
    enableColumnReordering,
    defaultColumnWidth = 150,
    refreshToken,
    identity,
  } = providerProps;

  const { data, dataProvider } = useResolvedProvider<T>(providerProps);

  const initializeStore = ctx.useSet(initializeStoreAtom);
  const storeAPI = useStoreAPI<T>();

  // The wrapper resolves the data source (see `DataSheet`); publish it into the
  // scoped atom so the loader/store read it, rather than the inner render
  // component resolving it each render. Kept updated as `data`/`provider`
  // changes.

  ctx.useSync(dataProviderAtom, dataProvider ?? DEFAULT_DATA_PROVIDER);
  ctx.useSync(interactionOptionsAtom, interactionOptions);

  const contentLabels = useMemo(() => {
    return { tableName: name, itemLabel };
  }, [name, itemLabel]);

  ctx.useSync(contentLabelsAtom, contentLabels);

  // A function `columnSpec` is derived from the loaded rows later (in
  // `_DataSheet`), not here — start it empty. Crucially it's kept OUT of the
  // init effect's deps: re-running init also resets `data`, so re-initializing
  // when the function's identity changes (e.g. a consumer hiding a column)
  // would wipe the loaded rows. `staticSpec` is a stable value in that case.
  const isFnSpec = typeof columnSpec === "function";

  const staticSpec = isFnSpec ? EMPTY_SPEC : columnSpec;
  // Not sure how required this initialization is
  const baseSpec = staticSpec ?? generateColumnSpec(data, columnSpecOptions);

  useEffect(() => {
    initializeStore({
      columnSpec: postprocessColumnSpec(baseSpec),
      // A function spec is derived from the loaded rows in `_DataSheet`; tell
      // the loader not to auto-generate a plain spec from the first chunk.
      deferColumnSpec: isFnSpec,
      editable: interactionOptions.enableEditing,
      enableColumnReordering,
      data,
      defaultColumnWidth,
      tableRef,
    });
  }, [
    data,
    interactionOptions.enableEditing,
    staticSpec,
    isFnSpec,
    columnSpecOptions,
    enableColumnReordering,
  ]);

  // Function `columnSpec`: derive the spec from the loaded rows (no separate
  // fetch of sample data), here at the provider level so BOTH renderers get it
  // — the sheet's cell grid and the panel's `FacetControls` read the same
  // derived spec. Derive once the first rows arrive, and re-derive when the
  // function's identity changes (a consumer memoizes it over its own view state
  // — hidden columns, order, overrides). Guarded by the function identity, so
  // it never re-runs as more rows page in (which would clobber in-store column
  // state on scroll).
  const loadedData = useSelector<T, T[]>((s) => s.data ?? []);
  const derivedSpecFor = useRef<unknown>(null);
  useEffect(() => {
    if (typeof columnSpec !== "function") return;
    if (derivedSpecFor.current === columnSpec) return;
    const rows = loadedData.filter((r) => r != null);
    if (rows.length === 0) return;
    derivedSpecFor.current = columnSpec;
    storeAPI.setState({ columnSpec: columnSpec(rows) });
  }, [columnSpec, loadedData, storeAPI]);

  const bumpRefresh = ctx.useSet(dataRefreshTokenAtom);

  // Imperative re-fetch: bump `refreshToken` to reload the provider (e.g.
  // after a save). Skips the initial mount (the loader does its own first
  // fetch). Shared by `_DataSheet` and `_DataPanel` — driven off this one
  // provider-level `refreshToken`, whichever renderer is mounted.
  const firstRefreshToken = useRef(true);
  useEffect(() => {
    if (firstRefreshToken.current) {
      firstRefreshToken.current = false;
      return;
    }
    bumpRefresh((v) => v + 1);
  }, [refreshToken, bumpRefresh]);

  // Provider-backed, auto-refreshing row mutations on the action context
  // (`ctx.saveRows` / `deleteRows` / `insertRow`) — shared by `_DataSheet` and
  // `_DataPanel` (the basis of a table/cards toggle) — so an immediate-edit
  // action persists through the active provider and then re-fetches. Only the
  // capabilities the provider supports are present.
  useEffect(() => {
    const p = dataProvider?.provider ?? null;
    const refresh = () => bumpRefresh((v) => v + 1);
    const withRefresh = <A extends any[]>(
      fn?: (...args: A) => Promise<void>,
    ) =>
      fn == null
        ? undefined
        : async (...args: A) => {
            await fn(...args);
            refresh();
          };
    storeAPI.setState({
      rowEditing: {
        saveRows: withRefresh(p?.saveRows?.bind(p)),
        deleteRows: withRefresh(p?.deleteRows?.bind(p)),
        insertRow: withRefresh(p?.insertRow?.bind(p)),
        refresh,
      },
    });
  }, [storeAPI, dataProvider, bumpRefresh]);

  // The active provider supplies the row identity for the edit overlay
  // (`tableDataAtom`'s remap-by-identity), shared by `_DataSheet` and
  // `_DataPanel` — falls back to the loose `identity` prop when the resolved
  // provider doesn't carry its own (e.g. before the first row loads).
  useEffect(() => {
    const id = dataProvider?.provider?.identity ?? identity;
    if (id != null) storeAPI.setState({ identity: id });
  }, [storeAPI, dataProvider, identity]);

  // Row deletion is a provider capability: an explicit `provider` (not a loose
  // `fetchData`/`data` source) without `deleteRows` disables deletion
  // entirely. Loose/local sources keep the in-table delete overlay. Shared by
  // `_DataSheet` and `_DataPanel` — gates the delete action's disabled state
  // read by the shared `ActionsToolbar`.
  useEffect(() => {
    const canDeleteRows =
      !dataProvider?.isExplicitProvider ||
      dataProvider.provider?.deleteRows != null;
    storeAPI.setState({ canDeleteRows });
  }, [storeAPI, dataProvider]);

  return children;
}

export function useStoreAPI<T>(): StoreApi<DataSheetStore<T>> {
  const store = ctx.useValue(storeAPIAtom);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return store;
}

export function useSelector<T = any, A = any>(
  selector: (state: DataSheetStore<T>) => A,
): A {
  const store = useStoreAPI<T>();
  return useStore(store, selector);
}
/** Atoms for efficient sub-selection of state */

export const columnSpecAtom = atom((get) => get(storeAtom)?.columnSpec ?? []);

export const tableDataAtom = atom(
  (get) => {
    return get(storeAtom)?.data ?? [];
  },
  (get, set, newData: any[]) => {
    set(storeAtom, (state: DataSheetState<any>): DataSheetState<any> => {
      let next: DataSheetState<any> = { ...state, data: newData };
      // Auto-generate a plain column spec the first time real rows arrive — no
      // spec yet and none deferred to a function (a function spec is derived
      // separately). Keyed on "spec still empty + a non-null row present", NOT
      // on `data.length == 0`: the loader pre-fills `data` with a page of `null`
      // ghost rows on reset, so the array is non-empty before the first chunk.
      if (state.columnSpec.length == 0 && !state.deferColumnSpec) {
        const sample = newData.filter((row) => row != null);
        if (sample.length > 0) {
          next.columnSpec = generateColumnSpec(sample, state.columnSpecOptions);
        }
      }

      // Re-attach the edit overlay by identity. The loader replaces `data` with
      // re-ordered windows on sort/filter, so an index-keyed overlay would
      // smear; keying by identity keeps edits (and deletes) on their rows, holds
      // edits for not-yet-loaded rows, and re-appends locally-added rows (which
      // aren't in the provider's data) after it. Skipped when the consumer
      // controls the overlay (they own reconciliation).
      if (!state.controlledOverlay) {
        const remap = remapOverlayByIdentity(state, newData);
        next.data = remap.data;
        next.updatedData = remap.updatedData;
        next.rowStatus = remap.rowStatus;
        next.pendingOverlayById = remap.pending;
      }

      return next;
    });
  },
);

type OverlayEntry = { edit?: any; status?: any };

/** Row identity used by the overlay: an in-table-added row's synthetic id
 * (stable across its edits), else the provider/consumer `identity`. */
function overlayIdentity(
  state: DataSheetState<any>,
  row: any,
): string | number | null | undefined {
  if (row == null) return undefined;
  const added = row[DS_ROW_ID];
  if (added != null) return added;
  return state.identity(row);
}

/** Re-project the (index-keyed) edit overlay from the old `data` order onto a
 * new one, matching rows by identity. Edits/statuses whose row is absent from
 * `newData` are held in `pending` and re-applied when the row loads; rows added
 * in-table (status `ADDED`) are re-appended after the provider data (they have
 * no provider row). Starts from the prior pending set so edits survive multiple
 * re-sorts. Returns the reconstructed data (provider rows + re-appended added
 * rows) alongside the re-aligned overlay. */
function remapOverlayByIdentity(
  state: DataSheetState<any>,
  newData: any[],
): {
  data: any[];
  updatedData: any[];
  rowStatus: any[];
  pending: Map<string | number, OverlayEntry>;
} {
  const { data: oldData, updatedData, rowStatus } = state;

  // Collect current overlay entries by identity, seeded with prior pending.
  const byId = new Map<string | number, OverlayEntry>(state.pendingOverlayById);
  const n = Math.max(
    oldData.length,
    updatedData?.length ?? 0,
    rowStatus?.length ?? 0,
  );
  for (let i = 0; i < n; i++) {
    const row = oldData[i];
    if (row == null) continue;
    const id = overlayIdentity(state, row);
    if (id == null) continue;
    const edit = updatedData?.[i];
    const status = rowStatus?.[i];
    if (edit != null || status != null) byId.set(id, { edit, status });
  }

  // Project onto the new data order.
  const resultData = newData.slice();
  const nextUpdated: any[] = [];
  const nextStatus: any[] = [];
  const attached = new Set<string | number>();
  for (let j = 0; j < resultData.length; j++) {
    const row = resultData[j];
    if (row == null) continue;
    const id = overlayIdentity(state, row);
    if (id == null) continue;
    const entry = byId.get(id);
    if (entry == null) continue;
    if (entry.edit != null) nextUpdated[j] = entry.edit;
    if (entry.status != null) nextStatus[j] = entry.status;
    attached.add(id);
  }

  // Re-append in-table-added rows (not present in the provider data), then hold
  // anything still unattached (rows not currently loaded) as pending.
  const pending = new Map<string | number, OverlayEntry>();
  for (const [id, entry] of byId) {
    if (attached.has(id)) continue;
    if (entry.status === TableElementStatus.ADDED) {
      const idx = resultData.length;
      resultData.push(entry.edit ?? {});
      nextUpdated[idx] = entry.edit;
      nextStatus[idx] = entry.status;
    } else {
      pending.set(id, entry);
    }
  }

  return {
    data: resultData,
    updatedData: nextUpdated,
    rowStatus: nextStatus,
    pending,
  };
}

interface ContentLabels {
  tableName: string | null | undefined;
  itemLabel: string | null | undefined;
}

const contentLabelsAtom = atom<ContentLabels>({
  tableName: null,
  itemLabel: null,
});

export const itemLabelAtom = atom<string>((get) => {
  return get(contentLabelsAtom).itemLabel ?? "row";
});
export const tableNameAtom = atom<string | null>((get) => {
  let { tableName, itemLabel } = get(contentLabelsAtom);
  if (tableName != null) return tableName;
  if (itemLabel != null) capitalize(pluralize(itemLabel, 2));
  return "Table";
});

export function useItemCount(n: number) {
  const dataKind = ctx.useValue(itemLabelAtom);
  return itemCount(n, dataKind ?? "row");
}

function itemCount(n: number, dataKind: string) {
  const base = n == 0 ? "No" : `${n}`;
  return base + " " + pluralize(dataKind, n);
}

export function pluralize(singularForm: string, n: number) {
  const pluralForm = singularForm + "s";
  if (n == 0) return `${pluralForm}`;
  if (n == 1) return singularForm;
  return pluralForm;
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
