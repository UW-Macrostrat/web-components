/**
 * Reading a column's vocabulary — the distinct values it holds — so a filter
 * control can offer choices that actually match something.
 *
 * The provider answers the question (`TableDataProvider.distinctValues`); this
 * is the ergonomic half: one hook, one fetch per column per view, shared by
 * every control that asks. Without it every consumer hand-rolls a fetch and a
 * cache per facet, which is exactly what the ingestion list was doing three
 * times over.
 */
import { useEffect, useState } from "react";
import { ctx, dataProviderAtom } from "./core.ts";
import {
  dataRefreshTokenAtom,
  DistinctValue,
  DistinctValuesOptions,
  TableDataProvider,
} from "./table-data.ts";

export interface DistinctValuesState<V = any> {
  /** The column's values, most useful first (frequency, then value). */
  values: DistinctValue<V>[];
  loading: boolean;
  error: Error | null;
  /** `false` when the source can't answer — a control should fall back to free
   * entry rather than showing an empty list. */
  supported: boolean;
}

const EMPTY: DistinctValue[] = [];

/**
 * The distinct values of `columnKey` in the enclosing view's source.
 *
 * Cached per (provider, column, refresh token): controls mount and unmount as
 * menus open, and shouldn't each pay for a request. A provider mutation bumps
 * the refresh token, so a newly-created value shows up without a manual
 * invalidation step.
 */
export function useDistinctValues<V = any>(
  columnKey: string | null | undefined,
  options: DistinctValuesOptions = {},
): DistinctValuesState<V> {
  const { provider } = ctx.useValue(dataProviderAtom);
  const refreshToken = ctx.useValue(dataRefreshTokenAtom);
  const { limit } = options;

  const supported = provider?.distinctValues != null && columnKey != null;
  const [state, setState] = useState<DistinctValuesState<V>>({
    values: EMPTY,
    loading: supported,
    error: null,
    supported,
  });

  useEffect(() => {
    if (!supported) {
      setState({ values: EMPTY, loading: false, error: null, supported });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, supported }));

    read(provider!, columnKey!, refreshToken, limit)
      .then((values) => {
        if (!active) return;
        setState({ values, loading: false, error: null, supported: true });
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setState({ values: EMPTY, loading: false, error, supported: true });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [provider, columnKey, refreshToken, limit, supported]);

  return state;
}

/** Just the values, for a control that doesn't care about counts or status. */
export function useDistinctValueList<V = any>(
  columnKey: string | null | undefined,
  options: DistinctValuesOptions = {},
): V[] {
  const { values } = useDistinctValues<V>(columnKey, options);
  return values.map((v) => v.value);
}

// One in-flight-or-settled promise per (provider, column, token, limit). Keyed
// weakly on the provider so a discarded view's cache goes with it.
const cache = new WeakMap<
  TableDataProvider<any>,
  Map<string, Promise<DistinctValue[]>>
>();

function read(
  provider: TableDataProvider<any>,
  columnKey: string,
  refreshToken: number,
  limit: number | undefined,
): Promise<DistinctValue[]> {
  let byKey = cache.get(provider);
  if (byKey == null) {
    byKey = new Map();
    cache.set(provider, byKey);
  }
  const key = `${columnKey} ${refreshToken} ${limit ?? ""}`;
  const cached = byKey.get(key);
  if (cached != null) return cached;

  // The shared promise deliberately carries no abort signal: one unmounting
  // control must not cancel the fetch for the others. Each caller's own signal
  // only decides whether it still cares about the result.
  const pending = provider.distinctValues!(columnKey, { limit }).catch(
    (error) => {
      // Don't cache a failure — the next control to mount should retry.
      byKey!.delete(key);
      throw error;
    },
  );
  byKey.set(key, pending);
  return pending;
}
