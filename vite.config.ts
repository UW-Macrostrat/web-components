import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    conditions: ["typescript"],
    dedupe: ["react", "react-dom"]
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
