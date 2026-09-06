/** The loader's core state and the seeding of a first window.
 *
 * Kept apart from the loader (`postgrest-table/data-loaders.ts`) so the
 * provider can seed the store at creation without a circular import.
 */
import { atom } from "jotai";
import type { AtomMap } from "@macrostrat/scoped-store";
import type { FetchDataOptions, FetchMode, InitialDataChunk } from "../types.ts";

export interface LazyLoaderStateCore<T> {
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  /** Reported source length when known (null = unknown / not reported). */
  totalCount: number | null;
  /** Windowing style: infinite-scroll windows, or one fixed page at a time. */
  fetchMode: FetchMode;
  /** Rows per chunk/page. */
  pageSize: number;
}

export const DEFAULT_LOADER_CORE: LazyLoaderStateCore<any> = {
  loading: false,
  error: null,
  initialized: false,
  totalCount: null,
  fetchMode: "scroll",
  pageSize: 100,
};

export const lazyLoaderCoreStateAtom =
  atom<LazyLoaderStateCore<any>>(DEFAULT_LOADER_CORE);

/** Normalize the two accepted `initialData` shapes (bare rows, or rows with a
 * total) to one. An empty seed is treated as no seed — there'd be nothing to
 * show and nothing saved. */
export function resolveInitialData<T>(
  initialData: FetchDataOptions<T>["initialData"],
): InitialDataChunk<T> | null {
  if (initialData == null) return null;
  if (Array.isArray(initialData)) {
    if (initialData.length === 0) return null;
    return { rows: initialData };
  }
  if ((initialData.rows ?? []).length === 0) return null;
  return initialData;
}

/** The data array for a seeded first window: the rows in place, pre-sized to
 * the reported total (with `null` for the rows not yet loaded) so the scrollbar
 * and the counter are right immediately. */
export function seededRows<T>(seed: InitialDataChunk<T>): (T | null)[] {
  const rows = seed.rows ?? [];
  const size = Math.max(seed.totalCount ?? rows.length, rows.length);
  const data: (T | null)[] = new Array(size).fill(null);
  for (let i = 0; i < rows.length; i++) data[i] = rows[i];
  return data;
}

/** The loader's core state for a seeded first window — the same shape as after
 * a completed first fetch. `initialized` means the loader neither refetches the
 * seeded window nor shows an empty state. */
export function seededLoaderCore<T>(
  seed: InitialDataChunk<T>,
): LazyLoaderStateCore<T> {
  return {
    ...DEFAULT_LOADER_CORE,
    initialized: true,
    totalCount: seed.totalCount ?? null,
  };
}

/** The identity of the row the current view starts after (`startAfter`), or
 * `null` for a view that starts at the top. Set at store creation so a server
 * render shows the "Return to top" link; the loader clears it on the first view
 * change. */
export const startAfterAtom = atom<string | number | null>(null);

/** Scoped-store atoms that make a store start out seeded. The store's own
 * `data` is seeded alongside (see `DataSheetStoreWrapper`). Empty when there is
 * no seed. */
export function loaderSeedAtoms<T>(
  initialData: FetchDataOptions<T>["initialData"],
  startAfter: FetchDataOptions<T>["startAfter"] = null,
): AtomMap {
  const atoms: AtomMap = [];
  if (startAfter != null) {
    atoms.push([startAfterAtom, startAfter]);
  }
  const seed = resolveInitialData(initialData);
  if (seed != null) {
    atoms.push([lazyLoaderCoreStateAtom, seededLoaderCore(seed)]);
  }
  return atoms;
}
