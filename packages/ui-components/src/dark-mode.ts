import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { Button, IButtonProps } from "@blueprintjs/core";
import { useStoredState } from "./util/local-storage";
import h from "@macrostrat/hyper";

type DarkModeState = { isEnabled: boolean; isAutoset: boolean };

type DarkModeUpdater = (enabled?: boolean) => void;

const ValueContext = createContext<DarkModeState | null>(null);
const UpdaterContext = createContext<DarkModeUpdater | null>(null);

const matcher = window?.matchMedia("(prefers-color-scheme: dark)");

const systemDarkMode = (): DarkModeState => ({
  isEnabled: matcher?.matches ?? false,
  isAutoset: true
});

type DarkModeProps = {
  children?: ReactNode;
  addBodyClasses: boolean;
};

const DarkModeProvider = (props: DarkModeProps) => {
  const { addBodyClasses = true, children } = props;
  const [storedValue, updateValue, resetState] = useStoredState(
    "ui-dark-mode",
    systemDarkMode()
  );
  // Guards so that we don't error on an invalid stored value
  const value = {
    isEnabled: storedValue?.isEnabled ?? false,
    isAutoset: storedValue?.isAutoset ?? false
  };

  // Manage dark mode body classes
  useEffect(() => {
    if (!addBodyClasses) return;
    if (value.isEnabled) {
      document.body.classList.add("bp3-dark");
    } else {
      document.body.classList.remove("bp3-dark");
    }
  }, [storedValue]);

  const update: DarkModeUpdater = (enabled: boolean | null) => {
    if (enabled == null) return resetState();
    const isEnabled = enabled ?? !value.isEnabled;
    updateValue({ isAutoset: false, isEnabled });
  };

  useEffect(() => {
    matcher?.addEventListener?.("change", e => {
      if (value.isAutoset) updateValue(systemDarkMode());
    });
  });

  return h(
    ValueContext.Provider,
    { value },
    h(UpdaterContext.Provider, { value: update }, children)
  );
};

const useDarkMode = () => useContext(ValueContext);
const inDarkMode = () => useDarkMode()?.isEnabled ?? false;
const darkModeUpdater = () => useContext(UpdaterContext);

const DarkModeButton = (props: IButtonProps & { allowReset: boolean }) => {
  const { allowReset = true, ...rest } = props;
  const { isEnabled, isAutoset } = useDarkMode();
  const icon = isEnabled ? "flash" : "moon";
  const update = darkModeUpdater();
  const onClick: React.MouseEventHandler = event => {
    if (allowReset && event.shiftKey) {
      update(null);
      return;
    }
    update(!isEnabled);
  };
  const active = !isAutoset;

  return h(Button, { active, ...rest, icon, onClick });
};

export {
  DarkModeProvider,
  useDarkMode,
  inDarkMode,
  darkModeUpdater,
  DarkModeButton
};
