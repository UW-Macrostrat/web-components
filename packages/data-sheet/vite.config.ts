import { defineConfig } from "vite";
import { resolve, relative } from "node:path";
import dts from "vite-plugin-dts";
import { ensureEntryFilesExist } from "../../scripts/publish-helpers/prepare";
import { getPackageDataFromDirectory } from "../../scripts/publish-helpers/status";

import pkg from "./package.json";

const workspaceRoot = resolve(__dirname, "../../");

const prefix = resolve(__dirname).replace(workspaceRoot, "").slice(1) + "/src";

const checkExportsPlugin = {
  name: "check-exports",
  async closeBundle() {
    ensureEntryFilesExist(getPackageDataFromDirectory(__dirname));
  },
};

export default defineConfig({
  root: __dirname,
  plugins: [
    dts({
      rollupTypes: false,
      tsconfigPath: resolve(__dirname, "tsconfig.json"),
      include: ["src"],
      outDir: resolve(__dirname, "dist"),
    }) as any,
    checkExportsPlugin,
  ],
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      // Library entry point (required)
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      cssFileName: "data-sheet",
      fileName: (format, entryName) => {
        // Place ES modules at root and CJS in /cjs subdirectory
        entryName = entryName.replace(prefix, format);
        if (format === "es") {
          entryName = entryName.replace("es/", "");
        }
        console.log("Building format:", format, "->", entryName);
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
