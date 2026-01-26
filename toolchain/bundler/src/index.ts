/** Common bundler for all libraries, using Vite */

import { build, defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";
import { ensureEntryFilesExist, readPackageJSON } from "./check-entries.js";
import chalk from "chalk";

const module = import.meta.url;
const __file = fileURLToPath(module);
const __dirname = dirname(__file);

const workspaceRoot = resolve(__dirname, "../../..");
const globalTypes = resolve(workspaceRoot, "global.d.ts");

export async function bundleLibrary(root) {
  /** Bundle a library for the browser with Vite */

  const pkg = readPackageJSON(root);

  console.log(`\nBundling library ${chalk.bold.cyan(pkg.name)}`);

  const pkgData = { ...pkg, directory: root };

  const checkExportsPlugin = {
    name: "check-exports",
    async closeBundle() {
      // Ensure that entry files exist after the bundle is complete
      ensureEntryFilesExist(pkgData);
    },
  };

  // Prefix for output files
  const prefix = resolve(root).replace(workspaceRoot, "").slice(1) + "/src";

  const packageNameWithoutScope = pkg.name.replace(/^@[^/]+\//, "");

  const viteConfig = defineConfig({
    root,
    plugins: [
      dts({
        rollupTypes: false,
        tsconfigPath: resolve(workspaceRoot, "tsconfig.base.json"),
        include: [resolve(root, "src"), globalTypes],
        // Exclude storybook files
        exclude: [
          resolve(root, "src", "**/*.stories.ts"),
          resolve(root, "src", "**/*.stories.tsx"),
        ],
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
        cssFileName: packageNameWithoutScope,
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
