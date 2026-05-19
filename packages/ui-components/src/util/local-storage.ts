import { useMemo, useState, useCallback } from "react";

class LocalStorage<T> {
  name: string;
  constructor(name: string) {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.name = name;
  }
  get(): T | null {
    const str = window.localStorage.getItem(this.name);
    if (str == null) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  set(obj: T) {
    const str = JSON.stringify(obj);
    return window.localStorage.setItem(this.name, str);
  }

  remove() {
    window.localStorage.removeItem(this.name);
  }
}

function useStoredState<S>(
  key: string | null,
  initialState: S | (() => S),
  isValid: ((state: S) => boolean) | null = null,
): [S, (nextState: S, validate?: boolean) => void, VoidFunction] {
  /** React hook for setting and getting values on local storage */
  const storage: LocalStorage<S> | null = useMemo(() => {
    if (typeof window == "undefined" || key == null) return null;
    return new LocalStorage<S>(key);
  }, [key]);
  let initialValue = storage?.get();

  const validator = useCallback(
    (state: S) => {
      try {
        if (isValid != null) return isValid(state);
        if (state == null) return false;
        let _initialState = initialState;
        if (typeof _initialState == "function") {
          _initialState = (_initialState as () => S)();
        }
        if (typeof state != typeof _initialState) return false;
        if (typeof state == "object" && typeof _initialState == "object") {
          const expectedKeys = Object.keys(_initialState as {});
          const actualKeys = Object.keys(state);
          if (expectedKeys.length != actualKeys.length) return false;
          for (const [key, value] of Object.entries(_initialState as {})) {
            if (!actualKeys.includes(key)) return false;
            if (typeof value != typeof state[key]) return false;
          }
        } else {
          return JSON.stringify(state) === JSON.stringify(_initialState);
        }
        return true;
      } catch {
        return false;
      }
    },
    [initialState, isValid],
  );

  if (initialValue != null && !validator(initialValue)) initialValue = null;
  const [state, _setState] = useState<S>(initialValue ?? initialState);

  const setState = useCallback(
    (nextState: S, validate = true) => {
      if (validate && !validator(nextState))
        throw `State ${nextState} is not valid.`;
      _setState(nextState);
      storage?.set(nextState);
    },
    [validator],
  );

  const resetState = useCallback(() => {
    _setState(initialState);
    storage?.remove();
  }, [initialState]);

  return [state, setState, resetState];
}

export { LocalStorage, useStoredState };
