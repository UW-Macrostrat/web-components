import { createSettingsContext } from "@macrostrat/ui-components";
// This will eventually help us move to "@macrostrat/ui-components" for settings provision

const [SettingsProvider, useSettings, useSettingsUpdater] =
  createSettingsContext<object>({});

// Deprecated: this is kind of confusing
const updateSettings = function (func) {
  // Update settings using `immutability-helper` semantics
  const updater: any = useSettingsUpdater();
  return function () {
    return updater(func(...arguments));
  };
};

export { SettingsProvider, useSettings, updateSettings };
