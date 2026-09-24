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
 */

export type ItemID = string | number;

export interface CombinedValues<E> {
  /** Every item any row holds, in order of first appearance; each the first
   * row's entry for it. */
  union: E[];
  /** The ids held by only some of the rows. */
  partial: Set<ItemID>;
}

export function combineValues<E>(
  values: E[][],
  idOf: (entry: E) => ItemID,
): CombinedValues<E> {
  const union = new Map<ItemID, E>();
  const counts = new Map<ItemID, number>();
  for (const row of values) {
    const seen = new Set<ItemID>();
    for (const entry of row) {
      const id = idOf(entry);
      if (seen.has(id)) continue;
      seen.add(id);
      if (!union.has(id)) union.set(id, entry);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const partial = new Set<ItemID>();
  for (const [id, n] of counts) {
    if (n < values.length) partial.add(id);
  }
  return { union: Array.from(union.values()), partial };
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
