import { useMemo, useState } from "react";

class LocalStorage {
  name: string;
  constructor(name: string) {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.name = name;
  }
  get(): object | null {
    const str = window.localStorage.getItem(this.name);
    try {
      const obj = JSON.parse(str);
      return obj;
    } catch {
      return null;
    }
  }
  set(obj: object) {
    const str = JSON.stringify(obj);
    return window.localStorage.setItem(this.name, str);
  }
}

function useStoredState(key: string, initialValue: object) {
  const storage = useMemo(() => new LocalStorage(key), [key]);
  const val = storage.get() ?? initialValue;
  const [state, setState] = useState(val);
  const updateState = newVal => {
    setState(newVal);
    storage.set(newVal);
  };
  return [state, updateState];
}

export { LocalStorage, useStoredState };
