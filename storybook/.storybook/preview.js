import macrostratTheme from "./theme";
import "@blueprintjs/core/lib/css/blueprint.css";

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
};
