/** Common bundler for all libraries, using Vite */

import { build, defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";
import {
  ensureEntryFilesExist,
  PackageData,
  readPackageJSON,
} from "./check-entries.js";
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

  // if we have a custom vite config, use that instead
  let viteConfig = null;
  try {
    viteConfig = (await import(resolve(root, "vite.config.ts"))).default;
    console.log(
      chalk.dim(
        `Using custom vite config for package ${pkg.name} from ${resolve(
          root,
          "vite.config.ts",
        )}`,
      ),
    );
  } catch (e) {
    // No custom config, use standard
    viteConfig = buildStandardViteConfig(pkg, root);
  }

  await build(viteConfig);
}

interface PackageJSONData extends Omit<PackageData, "directory"> {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function buildStandardViteConfig(pkg: PackageJSONData, root: string) {
  const packageNameWithoutScope = pkg.name.replace(/^@[^/]+\//, "");

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

  return defineConfig({
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

          const prefixToRemove = format + "/";
          if (entryName.startsWith(prefixToRemove)) {
            entryName = entryName.slice(prefixToRemove.length);
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
}
