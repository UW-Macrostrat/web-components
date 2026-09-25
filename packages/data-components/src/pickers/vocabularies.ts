/**
 * Where the pickers' vocabularies come from.
 *
 * By default, every picker reads its vocabulary from the enclosing
 * `MacrostratDataProvider` — the environment's own definitions, fetched once
 * and shared with everything else that uses them. Without a provider, the
 * default store points at the production API. A list passed as a prop
 * overrides the provider for that picker (a fixture, a restricted subset, a
 * vocabulary from another server), and nothing is fetched for it.
 */
import { useEffect, useMemo } from "react";
import { useMacrostratStore } from "@macrostrat/data-provider";

export type Vocabulary<T> = T[] | Map<any, T> | null | undefined;

type VocabularyKey =
  | "lithologies"
  | "environments"
  | "intervals"
  | "lithAttributes"
  | "timescales";

const loaders: Record<VocabularyKey, string> = {
  lithologies: "getLithologies",
  environments: "getEnvironments",
  intervals: "getIntervals",
  lithAttributes: "getLithAttributes",
  timescales: "getTimescales",
};

/** A picker's vocabulary as an array: the `override` when one is given, else
 * the provider's definitions (empty until they load). `null` for `override`
 * means "none", not "use the provider" — only `undefined` defers to it. */
export function useVocabulary<T>(
  key: VocabularyKey,
  override: Vocabulary<T> | undefined,
): T[] {
  const useProvider = override === undefined;
  const stored = useMacrostratStore((s) => s[key]);
  const load = useMacrostratStore((s) => s[loaders[key]]);

  useEffect(() => {
    if (!useProvider) return;
    // Each loader is a no-op once its vocabulary is complete; intervals are
    // asked for in full, since a store may hold only one timescale's worth.
    load(null, null);
  }, [useProvider, load]);

  return useMemo(() => {
    if (useProvider) return toArray<T>(stored);
    return toArray(override);
  }, [useProvider, stored, override]);
}

function toArray<T>(source: Vocabulary<T>): T[] {
  if (source == null) return [];
  if (Array.isArray(source)) return source;
  return Array.from(source.values());
}
