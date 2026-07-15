import type { Getter, Setter, Atom, WritableAtom } from "jotai";

export function passThroughSet<V, Args extends unknown[], Result>(
  atom: WritableAtom<V, Args, Result>,
) {
  return (get: Getter, set: Setter, ...args: Args): Result =>
    set(atom, ...args);
}

export function passThroughGet<T>(atom: Atom<T>) {
  return (get: Getter) => get(atom);
}
