/**
 * Where the pickers' vocabularies come from.
 *
 * By default, every picker reads its vocabulary from the enclosing
 * `MacrostratDataProvider` — the environment's own definitions, fetched once
 * and shared with everything else that uses them. Without a provider, the
 * default store points at the production API. A list passed as a prop
 * overrides the provider for that picker (a fixture, a restricted subset, a
 * vocabulary from another server), and nothing is fetched for it.
 *
 * **One index per vocabulary.** A picker is often one of hundreds — one per
 * cell of a table — and a vocabulary can run to thousands of entries (the
 * intervals). So a vocabulary's list and its lookup by id are built once for
 * each version of it and shared by every picker reading that version, rather
 * than copied and searched per picker.
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

/** The field each vocabulary is keyed on. */
const idFields: Record<VocabularyKey, string> = {
  lithologies: "lith_id",
  environments: "environ_id",
  intervals: "int_id",
  lithAttributes: "lith_att_id",
  timescales: "timescale_id",
};

/** A vocabulary as a list, and by id. */
export interface VocabularyIndex<T> {
  list: T[];
  byID: Map<any, T>;
}

/** A picker's vocabulary as an array: the `override` when one is given, else
 * the provider's definitions (empty until they load). `null` for `override`
 * means "none", not "use the provider" — only `undefined` defers to it. */
export function useVocabulary<T>(
  key: VocabularyKey,
  override: Vocabulary<T> | undefined,
): T[] {
  return useVocabularyIndex<T>(key, override).list;
}

/** A picker's vocabulary as a list and by id — shared by every picker that
 * reads the same version of it (see above). */
export function useVocabularyIndex<T>(
  key: VocabularyKey,
  override: Vocabulary<T> | undefined,
): VocabularyIndex<T> {
  const useProvider = override === undefined;
  const stored = useMacrostratStore((s) => s[key]);
  const load = useMacrostratStore((s) => s[loaders[key]]);

  useEffect(() => {
    if (!useProvider) return;
    // Each loader is a no-op once its vocabulary is complete; intervals are
    // asked for in full, since a store may hold only one timescale's worth.
    load(null, null);
  }, [useProvider, load]);

  const source = useProvider ? stored : override;
  return useMemo(
    () => vocabularyIndex<T>(source, idFields[key]),
    [source, key],
  );
}

const EMPTY_INDEX: VocabularyIndex<any> = { list: [], byID: new Map() };

/** Indexes by vocabulary object: one per version of a store's map, or per
 * list passed in. */
const indexes = new WeakMap<object, VocabularyIndex<any>>();

function vocabularyIndex<T>(
  source: Vocabulary<T>,
  idField: string,
): VocabularyIndex<T> {
  if (source == null) return EMPTY_INDEX;
  const cached = indexes.get(source);
  if (cached != null) return cached;
  let index: VocabularyIndex<T>;
  if (Array.isArray(source)) {
    index = {
      list: source,
      byID: new Map(source.map((d) => [(d as any)[idField], d])),
    };
  } else {
    // A store's map is already keyed by id
    index = { list: Array.from(source.values()), byID: source };
  }
  indexes.set(source, index);
  return index;
}

/** Something derived from a vocabulary list, once per list and key — the
 * interval editor's age-sorted items, per timescale. */
const derived = new WeakMap<object, Map<string, any>>();

export function derivedFromVocabulary<T, R>(
  list: T[],
  key: string,
  build: (list: T[]) => R,
): R {
  let byKey = derived.get(list);
  if (byKey == null) {
    byKey = new Map();
    derived.set(list, byKey);
  }
  if (!byKey.has(key)) byKey.set(key, build(list));
  return byKey.get(key);
}
