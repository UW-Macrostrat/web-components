import "@blueprintjs/core/lib/css/blueprint.css";
import { themes } from "@storybook/theming";

import { FocusStyleManager } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import "@macrostrat/style-system";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { useDarkMode } from "storybook-dark-mode";
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
};

export const decorators = [
  (renderStory) => {
    const isEnabled = useDarkMode();
    return h(
      PatternProvider,
      h(DarkModeProvider, { isEnabled }, renderStory())
    );
  },
];

export const tags = ["autodocs"];

function PatternProvider({ children }) {
  return h(GeologicPatternProvider, {
    resolvePattern(id: string) {
      return `https://dev2.macrostrat.org/assets/geologic-patterns/svg/${id}.svg`;
    },
    children,
  });
}
