/** Script to update all package tsconfig.json files to have a consistent structure.
 * Parallel to update-package-json-files.ts but for TypeScript configuration.
 *
 * These tsconfigs provide compilation boundaries for IDEs and are not used
 * directly for building (Vite handles that).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { getPackageDataFromDirectory, getPackages } from "./status";
import chalk from "chalk";

const manualPackagesToSkip = [
  "@macrostrat/web-components-bundler",
  "@macrostrat/hyperstyle-loader",
  "@macrostrat/vite-plugin-hyperstyles",
];

/** Collapse single-key JSON objects onto one line for readability */
function compactSingleKeyObjects(json: string): string {
  return json.replace(/\{\n\s+"(\w+)":\s*"([^"]+)"\n\s+\}/g, '{ "$1": "$2" }');
}

function writeIfChanged(
  filePath: string,
  newText: string,
  prefix: string,
): boolean {
  if (existsSync(filePath)) {
    const existingText = readFileSync(filePath, "utf-8");
    if (existingText === newText) {
      console.log(chalk.dim(prefix + "no changes"));
      return false;
    }
  }
  writeFileSync(filePath, newText, "utf-8");
  console.log(prefix + `Updated`);
  return true;
}

export function updateTsconfigFiles() {
  const candidatePackages = getPackages("packages/*", "toolchain/*");

  const firstColumnLength = 40;
  const rootReferences: { path: string }[] = [];

  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);

    let prefix = chalk.cyan.bold(pkg.name) + ": ";
    if (pkg.name.length < firstColumnLength) {
      prefix = prefix + " ".repeat(firstColumnLength - pkg.name.length);
    }

    const logSkip = (reason: string) => {
      console.log(chalk.dim(prefix + `Skipping (${reason})`));
    };

    if (manualPackagesToSkip.includes(pkg.name)) {
      logSkip("automatic management disabled");
      continue;
    }

    // All managed packages get a root reference
    rootReferences.push({ path: `./${packageDir}` });

    const tsconfigPath = resolve(packageDir, "tsconfig.json");
    const packageJsonPath = resolve(packageDir, "package.json");
    const packageData = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    // Compute relative path to repo root tsconfig.base.json
    const relativeToRoot = relative(packageDir, ".");
    const extendsPath = `${relativeToRoot}/tsconfig.base.json`;

    // Build workspace references from workspace:^ dependencies
    const references: { path: string }[] = [];
    const allDeps = {
      ...packageData.dependencies,
      ...packageData.peerDependencies,
    };

    for (const [depName, depVersion] of Object.entries<string>(allDeps)) {
      if (!depVersion.startsWith("workspace:")) continue;
      const shortName = depName.replace(/^@[^/]+\//, "");
      const candidatePaths = [
        resolve("packages", shortName),
        resolve("toolchain", shortName),
      ];
      const depDir = candidatePaths.find((p) => existsSync(p));
      if (depDir == null) continue;
      const relPath = relative(packageDir, depDir);
      references.push({ path: relPath });
    }
    references.sort((a, b) => a.path.localeCompare(b.path));

    // Determine include paths
    const include = ["src"];

    if (existsSync(resolve(packageDir, "stories"))) {
      include.push("stories");
    }

    // Build the tsconfig
    const tsconfig: any = {
      extends: extendsPath,
      compilerOptions: {
        composite: true,
        rootDir: "src",
        outDir: "dist",
        declarationDir: "dist",
      },
      include,
    };

    if (references.length > 0) {
      tsconfig.references = references;
    }

    const newText =
      compactSingleKeyObjects(JSON.stringify(tsconfig, null, 2)) + "\n";
    writeIfChanged(tsconfigPath, newText, prefix);
  }

  // Update the root tsconfig.json as a solution-style config
  rootReferences.sort((a, b) => a.path.localeCompare(b.path));

  const rootTsconfig = {
    extends: "./tsconfig.base.json",
    compilerOptions: {
      paths: {
        "@macrostrat/*": [
          "./packages/*/src/index.ts",
          "./toolchain/*/src/index.ts",
        ],
      },
    },
    // Solution-style: no files of its own, just references sub-projects
    files: [],
    references: rootReferences,
  };

  const rootText =
    compactSingleKeyObjects(JSON.stringify(rootTsconfig, null, 2)) + "\n";
  const rootPrefix = chalk.magenta.bold("root tsconfig.json") + ": ";
  writeIfChanged(resolve("tsconfig.json"), rootText, rootPrefix);
}

// Run the function
updateTsconfigFiles();
