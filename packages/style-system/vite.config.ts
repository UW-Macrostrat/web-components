import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/main.sass"),
      name: "@macrostrat/style-system",
      formats: ["es"],
      fileName: (format) => `style-system.${format}.js`,
    },
  },
});
