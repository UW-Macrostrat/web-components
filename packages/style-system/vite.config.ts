import { resolve, dirname } from "node:path";
import { defineConfig } from "vite";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
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
