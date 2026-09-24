/**
 * Tag lists over several rows at once — a picker standing for a selection of
 * units, say — as one list of what they hold between them.
 *
 * The picker shows the union: an item every row holds is drawn as usual, one
 * only some hold is *partial* (drawn faded, with an "Apply to all" in its
 * editor). Edits are then made to every row rather than by replacing their
 * lists with one: adding an item adds it to each row that lacks it, removing
 * one takes it out of each that has it, applying one to all adds it wherever
 * it's missing, and changing an item's details changes it in each row that
 * holds it. Every row keeps what it holds apart from the item changed.
 *
 * The entries rows hold for one item may differ within — a lithology's
 * attributes, its proportion. A `mergeItems` function merges them into the
 * entry the picker draws, saying whether they differ and which nested members
 * only some hold, so a nested list gets the same partial / apply-to-all
 * treatment. The default compares entries whole.
 */

export type ItemID = string | number;

/** What the rows hold of one item, merged: the entry to draw and edit, and
 * whether their entries for it differ. */
export interface MergedItem<E> {
  /** The entry the picker draws and edits: nested lists as the union of the
   * rows', fields that differ cleared. */
  value: E;
  /** Whether the rows' entries for the item differ at all. */
  multi: boolean;
  /** For each nested list (a lithology's `atts`), the members only some of
   * the rows' entries hold — partial in turn, with their own "apply to
   * all". */
  partial?: Record<string, Set<ItemID>>;
  /** The fields whose values differ between the rows' entries (drawn as
   * "mixed"). */
  mixed?: Set<string>;
}

/** Merge the entries for one item from every row that holds it. */
export type MergeItems<E> = (entries: E[]) => MergedItem<E>;

/** The default merge: the first entry, and whether the others equal it. */
export function mergeByEquality<E>(entries: E[]): MergedItem<E> {
  const first = entries[0];
  const token = JSON.stringify(first);
  const multi = entries.some((d) => JSON.stringify(d) !== token);
  return { value: first, multi };
}

/** A nested list's union across entries, and the members only some hold. */
export function mergeLists<V extends ItemID>(
  lists: (V[] | null | undefined)[],
): { union: V[]; partial: Set<ItemID> } {
  const { union, partial } = combineValues(
    lists.map((d) => d ?? []),
    (d) => d,
  );
  return { union, partial };
}

export interface CombinedValues<E> {
  /** Every item any row holds, in order of first appearance, as merged. */
  union: E[];
  /** The ids held by only some of the rows. */
  partial: Set<ItemID>;
  /** Each item's merge, by id. */
  merged: Map<ItemID, MergedItem<E>>;
}

export function combineValues<E>(
  values: E[][],
  idOf: (entry: E) => ItemID,
  mergeItems: MergeItems<E> = mergeByEquality,
): CombinedValues<E> {
  const entries = new Map<ItemID, E[]>();
  for (const row of values) {
    const seen = new Set<ItemID>();
    for (const entry of row) {
      const id = idOf(entry);
      if (seen.has(id)) continue;
      seen.add(id);
      let list = entries.get(id);
      if (list == null) {
        list = [];
        entries.set(id, list);
      }
      list.push(entry);
    }
  }
  const partial = new Set<ItemID>();
  const merged = new Map<ItemID, MergedItem<E>>();
  const union: E[] = [];
  for (const [id, list] of entries) {
    if (list.length < values.length) partial.add(id);
    const item = mergeItems(list);
    merged.set(id, item);
    union.push(item.value);
  }
  return { union, partial, merged };
}

/** A change to the union, made to every row: what was added is added to each
 * row that lacks it, what was removed is taken out of each that has it. */
export function applyUnionChange<E>(
  values: E[][],
  idOf: (entry: E) => ItemID,
  prevUnion: E[],
  nextUnion: E[],
): E[][] {
  const before = new Set(prevUnion.map(idOf));
  const after = new Set(nextUnion.map(idOf));
  const added = nextUnion.filter((d) => !before.has(idOf(d)));
  const removed = new Set([...before].filter((id) => !after.has(id)));
  return values.map((row) => {
    let next = row.filter((d) => !removed.has(idOf(d)));
    for (const entry of added) {
      if (!next.some((d) => idOf(d) === idOf(entry))) next = [...next, entry];
    }
    return next;
  });
}

/** Add an entry to every row that lacks it. */
export function addToAll<E>(
  values: E[][],
  idOf: (entry: E) => ItemID,
  entry: E,
): E[][] {
  const id = idOf(entry);
  return values.map((row) => {
    if (row.some((d) => idOf(d) === id)) return row;
    return [...row, entry];
  });
}

/** Change an item in every row that holds it. */
export function updateInEach<E>(
  values: E[][],
  idOf: (entry: E) => ItemID,
  id: ItemID,
  update: (entry: E) => E,
): E[][] {
  return values.map((row) =>
    row.map((d) => {
      if (idOf(d) !== id) return d;
      return update(d);
    }),
  );
}
