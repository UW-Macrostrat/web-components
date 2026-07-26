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

export function splitProps<T, R extends Partial<T>>(
  input: T,
  keys: Set<keyof R>,
): [R, Omit<T, keyof R>] {
  const requestedProps: Partial<T> = {};
  const otherProps: Partial<T> = {};
  for (const key in input) {
    if (keys.has(key as keyof R)) {
      requestedProps[key] = input[key];
    } else {
      otherProps[key] = input[key];
    }
  }
  return [requestedProps as R, otherProps as Omit<T, keyof R>];
}
