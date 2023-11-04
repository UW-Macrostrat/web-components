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

type DarkModeState = {
  isEnabled: boolean;
  isAutoset: boolean;
  isSystemPreferred: boolean | null;
};

type DarkModeUpdater = (enabled?: boolean) => void;

function systemPreferredDarkMode() {
  if (typeof window === "undefined") return null;
  const matcher = window.matchMedia("(prefers-color-scheme: dark)");
  return matcher?.matches;
}

function systemDarkMode(): DarkModeState {
  const isSystemPreferred = systemPreferredDarkMode();
  return {
    isSystemPreferred,
    isEnabled: isSystemPreferred ?? false,
    isAutoset: true,
  };
}

function setDarkReaderMeta(enabled: boolean = true) {
  // Ensure that Dark Reader doesn't apply to this page
  const meta = document.querySelector("meta[name=darkreader-lock]");
  if (enabled && meta == null) {
    const meta = document.createElement("meta");
    meta.name = "darkreader-lock";
    document.head.append(meta);
  }
  if (!enabled && meta != null) meta.remove();
}

const ValueContext = createContext<DarkModeState>({
  isSystemPreferred: null,
  isEnabled: false,
  isAutoset: false,
});
const UpdaterContext = createContext<DarkModeUpdater | null>(null);

type DarkModeProps = {
  children?: ReactNode;
  isEnabled?: boolean;
  /** Override with system dark mode setting on page load */
  followSystem?: boolean;
  bodyClasses?: string[];
  // Deprecated
  addBodyClasses?: boolean;
};

function applySystemDarkMode(
  initialValue: DarkModeState,
  forceFollowSystem: boolean,
  systemPreferred: boolean | null
): DarkModeState {
  const _systemPreferred = systemPreferred ?? systemPreferredDarkMode();
  if (initialValue.isAutoset || forceFollowSystem) {
    return {
      isSystemPreferred: _systemPreferred,
      isEnabled: _systemPreferred ?? false,
      isAutoset: true,
    };
  } else {
    return {
      ...initialValue,
      isSystemPreferred: _systemPreferred,
    };
  }
}

const _DarkModeProvider = (props: DarkModeProps) => {
  const {
    addBodyClasses = true,
    isEnabled,
    followSystem = false,
    bodyClasses = ["dark-mode", "bp4-dark"],
    children,
  } = props;
  const [storedValue, updateValue, resetState] = useStoredState(
    "ui-dark-mode",
    systemDarkMode()
  );
  // Guards so that we don't error on an invalid stored value
  const value = {
    isSystemPreferred: storedValue?.isSystemPreferred ?? null,
    isEnabled: storedValue?.isEnabled ?? false,
    isAutoset: storedValue?.isAutoset ?? false,
  };

  useEffect(() => {
    // Update value if isEnabled is provided
    if (isEnabled && followSystem) {
      console.warn(
        "DarkModeProvider: followSystem and isEnabled are mutually exclusive. Ignoring followSystem"
      );
    }
    if (isEnabled == null) {
      updateValue(applySystemDarkMode(value, followSystem, null));
    } else {
      updateValue({
        isAutoset: false,
        isEnabled,
        isSystemPreferred: systemPreferredDarkMode(),
      });
    }
  }, [isEnabled, followSystem]);

  // Manage dark mode body classes
  useEffect(() => {
    // addBodyClasses will eventually be replaced
    const _addBodyClasses = addBodyClasses ?? bodyClasses != null;
    if (!_addBodyClasses) return;
    setDarkReaderMeta(value.isEnabled);
    if (value.isEnabled) {
      document.body.classList.add(...bodyClasses);
    } else {
      document.body.classList.remove(...bodyClasses);
    }
  }, [storedValue, bodyClasses, addBodyClasses]);

  const update: DarkModeUpdater = useCallback(
    (enabled: boolean | null) => {
      if (enabled == null) return resetState();
      updateValue({
        isAutoset: false,
        isEnabled: enabled ?? isEnabled ?? false,
        isSystemPreferred: value.isSystemPreferred,
      });
    },
    [isEnabled]
  );

  const onSystemChange = useCallback(
    (e) => updateValue(applySystemDarkMode(value, followSystem, e.matches)),
    [value, followSystem]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

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
