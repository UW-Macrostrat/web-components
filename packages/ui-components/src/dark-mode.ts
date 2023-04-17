import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { Button, ButtonProps } from "@blueprintjs/core";
import { useStoredState } from "./util/local-storage";
import h from "@macrostrat/hyper";

type DarkModeState = { isEnabled: boolean; isAutoset: boolean };

type DarkModeUpdater = (enabled?: boolean) => void;

const systemDarkMode = (): DarkModeState => ({
  isEnabled: matcher?.matches ?? false,
  isAutoset: true,
});

const ValueContext = createContext<DarkModeState>(null);
const UpdaterContext = createContext<DarkModeUpdater | null>(null);

const matcher = window?.matchMedia("(prefers-color-scheme: dark)");

type DarkModeProps = {
  children?: ReactNode;
  addBodyClasses: boolean;
  isEnabled?: boolean;
};

const DarkModeProvider = (props: DarkModeProps) => {
  const parentCtx = useContext(ValueContext);
  const { addBodyClasses = true, isEnabled, children } = props;
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

  useEffect(() => {
    matcher?.addEventListener?.("change", (e) => {
      if (value.isAutoset) updateValue(systemDarkMode());
    });
  });

  if (parentCtx != null) {
    return h(React.Fragment, null, children);
  }

  return h(
    ValueContext.Provider,
    { value },
    h(UpdaterContext.Provider, { value: update }, children)
  );
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
