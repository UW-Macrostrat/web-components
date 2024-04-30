import "@blueprintjs/core/lib/css/blueprint.css";
import { themes } from "@storybook/theming";
import macrostratTheme from "./theme";

import { FocusStyleManager } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import "@macrostrat/style-system";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { useDarkMode } from "storybook-dark-mode";

FocusStyleManager.onlyShowFocusOnTabs();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    theme: macrostratTheme,
  },
  backgrounds: {
    disable: true,
  },
  darkMode: {
    // Override the default light theme
    //current: "light",
    dark: { ...themes.dark },
    light: { ...themes.light },
    darkClass: ["bp5-dark"],
    lightClass: [],
    stylePreview: true,
  },
};

// your theme provider

// create a component that uses the dark mode hook
function ThemeWrapper(props) {
  // render your custom theme provider
  return h(DarkModeProvider, { isEnabled: useDarkMode(), ...props });
}

export const decorators = [
  (renderStory) => h(ThemeWrapper, null, renderStory()),
];
