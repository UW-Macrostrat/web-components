import "@blueprintjs/core/lib/css/blueprint.css";
import { themes } from "@storybook/theming";
import macrostratTheme from "./theme";

import { Preview } from "@storybook/react";
import { FocusStyleManager } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import "@macrostrat/style-system";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { useDarkMode } from "storybook-dark-mode";
import { DocsContainer } from "./docs-container";

FocusStyleManager.onlyShowFocusOnTabs();

const preview: Preview = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // docs: {
  //   container: DocsContainer,
  // },
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
  decorators: [
    (Story) => {
      const isEnabled = useDarkMode();
      return h(DarkModeProvider, { isEnabled }, h(Story));
    },
  ],
  tags: ["autodocs"],
};

export default preview;
