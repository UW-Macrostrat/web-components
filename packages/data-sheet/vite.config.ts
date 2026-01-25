import { defineConfig } from "vite";
import { resolve, relative } from "node:path";

import pkg from "./package.json";

const workspaceRoot = resolve(__dirname, "../../");

const prefix = resolve(__dirname).replace(workspaceRoot, "").slice(1) + "/src";

import ts2 from "rollup-plugin-typescript2";

export default defineConfig({
  root: __dirname,
  plugins: [ts2()],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      // Library entry point (required)
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      cssFileName: "data-sheet",
      fileName: (format, entryName) => {
        console.log(entryName, prefix);
        // e1
        entryName = entryName.replace(prefix, format);
        return `${entryName}.${format === "es" ? "js" : "cjs"}`;
      },
    },
    // Optional: add sourcemaps
    // Optional: do not minify for better debugging if you want consumers to handle it
    minify: false,
    // Rollup options
    rollupOptions: {
      // External dependencies that should not be bundled
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ],
      output: {
        preserveModules: true,
        exports: "named", // Ignore module export warning for sass files.
      },
    },
  },
});
