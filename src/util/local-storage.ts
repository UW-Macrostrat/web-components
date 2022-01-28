import {
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";

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

  remove() {
    window.localStorage.removeItem(this.name);
  }
}

function useStoredState<S>(
  key: string,
  initialState: S | (() => S),
  isValid: (S) => boolean = (d) => true
): [S, Dispatch<SetStateAction<S>>, VoidFunction] {
  /** React hook for setting and getting values on local storage */
  const storage = useMemo(() => new LocalStorage<S>(key), [key]);
  let initialValue = storage.get();
  if (!isValid(initialValue)) initialValue = null;
  const [state, _setState] = useState<S>(initialValue ?? initialState);

  const setState = useCallback(
    (nextState: S, validate = true) => {
      if (validate && !isValid(nextState))
        throw `State ${nextState} is not valid.`;
      _setState(nextState);
      storage.set(nextState);
    },
    [isValid]
  );

  const resetState = useCallback(() => {
    _setState(initialState);
    storage.remove();
  }, [initialState]);

  return [state, setState, resetState];
}

export { LocalStorage, useStoredState };
