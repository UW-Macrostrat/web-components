import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    conditions: ["source"],
    dedupe: [
      "react",
      "react-dom",
      "@macrostrat/ui-components",
      "@macrostrat/column-components",
      "@macrostrat/mapbox-react",
      "@macrostrat/map-interface",
      "@macrostrat/column-views",
    ],
  },
  optimizeDeps: {
    exclude: ["node_modules/.cache/storybook"],
  },
  css: {
    preprocessorOptions: {
      // https://vite.dev/config/shared-options.html#css-preprocessoroptions
      sass: {
        api: "modern-compiler", // or "modern", "legacy"
      },
    },
  },
});
