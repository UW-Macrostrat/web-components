import { useMemo, useState, Dispatch, SetStateAction } from "react";

class LocalStorage<T> {
  name: string;
  constructor(name: string) {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.name = name;
  }
  get(): T | null {
    const str = window.localStorage.getItem(this.name);
    try {
      const obj = JSON.parse(str);
      return obj;
    } catch {
      return null;
    }
  }
  set(obj: T) {
    const str = JSON.stringify(obj);
    return window.localStorage.setItem(this.name, str);
  }
}

function useStoredState<S>(
  key: string,
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
  /** React hook for setting and getting values on local storage */
  const storage = useMemo(() => new LocalStorage<S>(key), [key]);
  const val = storage.get() ?? initialState;
  const [state, setState] = useState<S>(val);
  const updateState = newVal => {
    setState(newVal);
    storage.set(newVal);
  };
  return [state, updateState];
}

export { LocalStorage, useStoredState };
