import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    conditions: ["typescript"],
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
