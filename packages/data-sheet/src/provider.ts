import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type { Table } from "@blueprintjs/table";
import { generateColumnSpec, type ColumnSpec } from "./utils";
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
import { toasterAtom } from "./notifications.ts";
import { TableAction } from "./actions";
import { createLocalProvider, type FetchData, type TableDataProvider } from "./postgrest-table";
import { atom } from "jotai";

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
  (get, set, action: SetStateAction<T>) => {
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
  (get, set, payload: Partial<DataSheetStore<T>>) => {
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
 * loads the whole array at once and shows no load progress). */
export interface ResolvedDataProvider {
  provider: TableDataProvider<any> | null;
  isLocalProvider: boolean;
}

const DEFAULT_DATA_PROVIDER: ResolvedDataProvider = {
  provider: null,
  isLocalProvider: true,
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
  const dataProvider = useMemo(
    () => ({ provider: activeProvider, isLocalProvider }),
    [activeProvider, isLocalProvider],
  );
  return { data: _data, isLocalProvider, activeProvider, dataProvider };
}

export function DataSheetProvider<T>(
  props: DataSheetProviderProps<T> & { dataProvider?: ResolvedDataProvider },
) {
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

export function DataSheetProviderInner<T>({
  children,
  data,
  columnSpec,
  columnSpecOptions,
  editable,
  enableColumnReordering,
  defaultColumnWidth = 150,
  dataProvider,
}: DataSheetProviderProps<T> & { dataProvider?: ResolvedDataProvider }) {
  const tableRef = useRef<Table>(null);

  const initializeStore = ctx.useSet(initializeStoreAtom);

  // The wrapper resolves the data source (see `DataSheet`); publish it into the
  // scoped atom so the loader/store read it, rather than the inner render
  // component resolving it each render. Kept updated as `data`/`provider`
  // changes.
  ctx.useSync(dataProviderAtom, dataProvider ?? DEFAULT_DATA_PROVIDER);

  // A function `columnSpec` is derived from the loaded rows later (in
  // `_DataSheet`), not here — start it empty. Crucially it's kept OUT of the
  // init effect's deps: re-running init also resets `data`, so re-initializing
  // when the function's identity changes (e.g. a consumer hiding a column)
  // would wipe the loaded rows. `staticSpec` is a stable value in that case.
  const isFnSpec = typeof columnSpec === "function";
  const staticSpec = isFnSpec ? EMPTY_SPEC : columnSpec;

  // Not sure how required this initialization is
  useEffect(() => {
    initializeStore({
      columnSpec: staticSpec ?? generateColumnSpec(data, columnSpecOptions),
      // A function spec is derived from the loaded rows in `_DataSheet`; tell
      // the loader not to auto-generate a plain spec from the first chunk.
      deferColumnSpec: isFnSpec,
      editable,
      enableColumnReordering,
      data,
      defaultColumnWidth,
      tableRef,
    });
  }, [data, editable, staticSpec, isFnSpec, columnSpecOptions, enableColumnReordering]);

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
  selector: (state: DataSheetStore<T> & DataSheetComputedVals) => A,
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
