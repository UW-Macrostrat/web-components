import { build, defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";
import { ensureEntryFilesExist, readPackageJSON } from "./check-entries.js";

const module = import.meta.url;
const __file = fileURLToPath(module);
const __dirname = dirname(__file);

const workspaceRoot = resolve(__dirname, "../../..");
const globalTypes = resolve(workspaceRoot, "global.d.ts");

export async function bundleLibrary(root) {
  /** Bundle a library for the browser with Vite */
  const pkg = readPackageJSON(root);
  const pkgData = { ...pkg, directory: root };

  const checkExportsPlugin = {
    name: "check-exports",
    async closeBundle() {
      ensureEntryFilesExist(pkgData);
    },
  };

  // Prefix for output files
  const prefix = resolve(root).replace(workspaceRoot, "").slice(1) + "/src";

  const viteConfig = defineConfig({
    root,
    plugins: [
      dts({
        rollupTypes: false,
        tsconfigPath: resolve(workspaceRoot, "tsconfig.base.json"),
        include: [resolve(root, "src"), globalTypes],
        outDir: resolve(root, "dist"),
        // We don't care too much about Typescript types. We could change this.
        logLevel: "silent",
      }) as any,
      checkExportsPlugin,
    ],
    build: {
      outDir: resolve(root, "dist"),
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        // Library entry point (required)
        entry: resolve(root, "src/index.ts"),
        formats: ["es", "cjs"],
        cssFileName: "data-sheet",
        fileName: (format, entryName) => {
          // Place ES modules at root and CJS in /cjs subdirectory
          entryName = entryName.replace(prefix, format);
          if (format === "es") {
            entryName = entryName.replace("es/", "");
          }
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

  await build(viteConfig);
}
