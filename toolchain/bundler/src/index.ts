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
import { cjsInterop } from "vite-plugin-cjs-interop";

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

interface ViteConfigOpts {
  verbose?: boolean;
}

const troublesomeDependenciesToInternalize = [
  "@uiw/react-color",
  "use-async-effect",
  "react-json-tree",
];

function buildStandardViteConfig(
  pkg: PackageJSONData,
  root: string,
  opts: ViteConfigOpts = {},
) {
  /** Build a standardized vite configuration for packages */

  const verbose = opts.verbose ?? false;

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

  const externalDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].filter((dep) => !troublesomeDependenciesToInternalize.includes(dep));

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
          resolve(root, "stories"),
        ],
        outDir: resolve(root, "dist"),
        // We don't care too much about Typescript types. We could change this.
        logLevel: verbose ? "info" : "silent",
      }) as any,
      checkExportsPlugin,
      // cjsInterop({
      //   dependencies: ["labella", "ui-box"],
      // }),
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

          // Remove prefixes
          for (const splitPart of ["node_modules", prefix]) {
            const partWithSlashes = splitPart + "/";
            if (entryName.includes(partWithSlashes)) {
              const parts = entryName.split(partWithSlashes);
              entryName = parts[parts.length - 1];
            }
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
        external: externalDeps,
        output: {
          preserveModules: true,
          interop: "auto",
        },
      },
    },
  });
}
