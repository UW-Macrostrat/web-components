import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Button, ButtonProps } from "@blueprintjs/core";
import { useStoredState } from "./util/local-storage";
import h from "@macrostrat/hyper";

type DarkModeState = { isEnabled: boolean; isAutoset: boolean };

type DarkModeUpdater = (enabled?: boolean) => void;

function systemDarkMode(): DarkModeState {
  const win = window !== undefined ? window : null;
  const matcher = win?.matchMedia("(prefers-color-scheme: dark)");
  return {
    isEnabled: matcher?.matches ?? false,
    isAutoset: true,
  };
}

const ValueContext = createContext<DarkModeState>({
  isEnabled: false,
  isAutoset: false,
});
const UpdaterContext = createContext<DarkModeUpdater | null>(null);

type DarkModeProps = {
  children?: ReactNode;
  addBodyClasses: boolean;
  isEnabled?: boolean;
  followSystem?: boolean;
};

const _DarkModeProvider = (props: DarkModeProps) => {
  const {
    addBodyClasses = true,
    isEnabled,
    followSystem = false,
    children,
  } = props;
  const [storedValue, updateValue, resetState] = useStoredState(
    "ui-dark-mode",
    systemDarkMode()
  );
  // Guards so that we don't error on an invalid stored value
  const value = {
    isEnabled: storedValue?.isEnabled ?? false,
    isAutoset: storedValue?.isAutoset ?? false,
  };

  useEffect(() => {
    if (!followSystem) return;
    updateValue(systemDarkMode());
  }, []);

  useEffect(() => {
    // Update value if isEnabled is provided
    if (isEnabled == null) return;
    updateValue({ isAutoset: false, isEnabled });
  }, [isEnabled]);

  // Manage dark mode body classes
  useEffect(() => {
    if (!addBodyClasses) return;
    if (value.isEnabled) {
      document.body.classList.add("bp4-dark");
    } else {
      document.body.classList.remove("bp4-dark");
    }
  }, [storedValue]);

  const update: DarkModeUpdater = (enabled: boolean | null) => {
    if (enabled == null) return resetState();
    const isEnabled = enabled ?? !value.isEnabled;
    updateValue({ isAutoset: false, isEnabled });
  };

  const onSystemChange = useCallback(
    (e) => {
      if (value.isAutoset || followSystem) updateValue(systemDarkMode());
    },
    [value.isAutoset, followSystem]
  );

  useEffect(() => {
    if (window === undefined) return;

    const matcher = window.matchMedia("(prefers-color-scheme: dark)");

    matcher.addEventListener("change", onSystemChange);
    return () => {
      matcher.removeEventListener("change", onSystemChange);
    };
  }, [onSystemChange]);

  return h(
    ValueContext.Provider,
    { value },
    h(UpdaterContext.Provider, { value: update }, children)
  );
};

const DarkModeProvider = (props: DarkModeProps) => {
  // Ensure that only one provider is active for an application
  const parentCtx = useContext(UpdaterContext);
  if (parentCtx != null) return props.children ?? null;
  return h(_DarkModeProvider, props);
};

const useDarkMode = () => useContext(ValueContext);
const inDarkMode = () => useDarkMode()?.isEnabled ?? false;
const darkModeUpdater = () => useContext(UpdaterContext);

const DarkModeButton = (
  props: ButtonProps & { allowReset: boolean; showText: boolean }
) => {
  const { allowReset = true, showText = false, children, ...rest } = props;
  const { isEnabled, isAutoset } = useDarkMode();
  const icon = isEnabled ? "flash" : "moon";
  const update = darkModeUpdater();
  const onClick: React.MouseEventHandler = (event) => {
    if (update == null) {
      console.warn("No DarkModeProvider is available");
      return;
    }
    if (allowReset && event.shiftKey) {
      update(null);
      return;
    }
    update(!isEnabled);
  };
  const active = !isAutoset;

  return h(Button, { active, ...rest, icon, onClick }, [
    h.if(showText)([isEnabled ? "Light" : "Dark"]),
    children,
  ]);
};

export {
  DarkModeProvider,
  useDarkMode,
  inDarkMode,
  darkModeUpdater,
  DarkModeButton,
};
