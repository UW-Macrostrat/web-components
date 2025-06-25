import "@blueprintjs/core/lib/css/blueprint.css";
import { themes } from "storybook/theming";

import { FocusStyleManager, HotkeysProvider } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import "@macrostrat/style-system/src/main.sass";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { useDarkMode } from "@vueless/storybook-dark-mode";
import { DocsContainer } from "./docs-container";
import { GeologicPatternProvider } from "@macrostrat/column-components";

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
    container: DocsContainer,
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
  parameters: {
    options: {
      storySort: {
        order: [
          "Web components",
          "Example story",
          "Map interface",
          "Column views",
          "Timescale",
          "Column components",
        ],
      },
    },
  },
};

export const decorators = [
  (renderStory) => {
    const isEnabled = useDarkMode();
    return h(
      PatternProvider,
      h(DarkModeProvider, { isEnabled }, renderStory()),
    );
  },
];

export const tags = ["autodocs"];

function PatternProvider({ children }) {
  return h(GeologicPatternProvider, {
    resolvePattern(id: string) {
      return `https://dev.macrostrat.org/assets/geologic-patterns/svg/${id}.svg`;
    },
    children,
  });
}
