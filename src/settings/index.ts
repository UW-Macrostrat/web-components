import h from "@macrostrat/hyper";
import { ReactNode } from "react";
import { createContext, useState, useContext } from "react";
import update, { Spec } from "immutability-helper";
import { LocalStorage } from "../util/local-storage";

interface SettingsProviderProps {
  children: ReactNode;
  storageID?: string;
}

// Could rework this to use `constate` or similar

function createSettingsContext<T extends object>(defaultValue: T) {
  /** Function that creates a context with an updateable settings object
   */
  const Context = createContext<T>(defaultValue);

  type SettingsUpdateSpec = Spec<T>;
  type Updater = (spec: SettingsUpdateSpec) => void;
  const UpdateContext = createContext<Updater | null>(null);

  const Provider = function(props: SettingsProviderProps & T) {
    /*
    A settings provider that can be used with LocalStorage
    */
    let { storageID, children, ...defaultSettings } = props;
    // Update from local storage
    let storage = null;
    console.log("Setting up SettingsProvider [ui-components]");
    if (storageID != null) {
      // Merge initial options if set
      storage = new LocalStorage(storageID);
      const v = storage.get() || {};
      console.log("Loading from local storage", v);
      // @ts-ignore
      defaultSettings = update(defaultSettings, { $merge: v });
    }

    // @ts-ignore
    const [settings, setState] = useState<T>(defaultSettings);
    const updateState = function(spec: SettingsUpdateSpec) {
      const newSettings = update(settings, spec);
      setState(newSettings);
      if (storage != null) {
        return storage.set(newSettings);
      }
    };

    return h(Context.Provider, { value: settings }, [
      h(UpdateContext.Provider, { value: updateState }, children)
    ]);
  };

  const useValue = () => useContext(Context);

  const useUpdater = (key: string | undefined) => {
    const updater = useContext(UpdateContext);
    if (key == null) return updater;
    //@ts-ignore
    return (spec: Spec<any>) => updater({ [key]: spec });
  };

  return [Provider, useValue, useUpdater];
}

const [
  SettingsProvider,
  useSettings,
  useSettingsUpdater
] = createSettingsContext<object>({});

// Deprecated: this is kind of confusing
const updateSettings = function(func) {
  // Update settings using `immutability-helper` semantics
  //@ts-ignore
  const updater = useSettingsUpdater();
  return function() {
    //@ts-ignore
    return updater(func(...arguments));
  };
};

export { SettingsProvider, useSettings, updateSettings, createSettingsContext };
