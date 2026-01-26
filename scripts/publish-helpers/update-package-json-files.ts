/** Function to update all package JSON files in a repo to have consistent fields */

// Uses the 'style' field from the package.json to infer whether there is an associated CSS stylesheet

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPackageDataFromDirectory, getPackages } from "./status";
import chalk from "chalk";

const manualPackagesToFix = [
  "@macrostrat/api-types",
  "@macrostrat/style-system",
  "@macrostrat/web-components-bundler",
  "@macrostrat/hyperstyle-loader",
];

const packageJSONKeyOrder = [
  "name",
  "version",
  "private",
  "description",
  "keywords",
  "homepage",
  "repository",
  "bugs",
  "license",
  "author",
  "type",
  "main",
  "module",
  "node",
  "source",
  "types",
  "files",
  "sideEffects",
  "source",
  "style",
  "exports",
  "scripts",
  "peerDependencies",
  "dependencies",
  "devDependencies",
];

export function updatePackageJsonFiles() {
  // Get the root package JSON
  const candidatePackages = getPackages("packages/*", "toolchain/*");

  const packagesWithCSSSideEffects = [];

  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);

    const firstColumnLength = 40;
    let prefix = chalk.cyan.bold(pkg.name) + ": ";
    if (pkg.name.length < firstColumnLength) {
      prefix = prefix + " ".repeat(firstColumnLength - pkg.name.length);
    }

    const logSkip = (reason: string) => {
      console.log(chalk.dim(prefix + `Skipping (${reason})`));
    };

    if (manualPackagesToFix.includes(pkg.name)) {
      logSkip("automatic management disabled");
      continue;
    }

    // Handle all packages
    const packageJSONPath = resolve(packageDir, "package.json");
    const packageDataText = readFileSync(packageJSONPath, "utf-8");
    const packageData = JSON.parse(packageDataText);

    if (packageData.type !== "module") {
      logSkip(chalk.red("not an ESM module"));
      continue;
    }

    const shortModuleName = pkg.name.replace(/^@[^/]+\//, "");

    const styleSheetName = `dist/${shortModuleName}.css`;
    const esmFileName = `dist/index.js`;
    const cjsFileName = `dist/index.cjs`;
    const typesFileName = `dist/index.d.ts`;
    const sourceFileName = `src/index.ts`;

    const exports = {
      ".": {
        import: `./${esmFileName}`,
        require: `./${cjsFileName}`,
        types: `./${typesFileName}`,
        source: `./${sourceFileName}`,
      },
      "./package.json": "./package.json",
    };

    let newPackageData: any = {
      type: "module",
      source: "src/index.ts",
      main: esmFileName,
      types: typesFileName,
      node: cjsFileName,
      exports,
      files: ["src", "dist"],
      repository: {
        type: "git",
        url: "https://github.com/UW-Macrostrat/web-components.git",
        directory: pkg.directory,
      },
      license: "MIT",
    };

    if ("style" in packageData) {
      newPackageData.style = styleSheetName;
      const relStyleSheetName = `./${styleSheetName}`;
      exports["."]["style"] = relStyleSheetName;
      exports["./style.css"] = relStyleSheetName;
      exports[relStyleSheetName] = relStyleSheetName;
      newPackageData["sideEffects"] = ["**/*.css"];
      packagesWithCSSSideEffects.push({ ...pkg, styleSheetName });
    }
    // Merge with existing package data
    newPackageData = { ...packageData, ...newPackageData };

    newPackageData.devDependencies ??= {};
    newPackageData.devDependencies["@macrostrat/web-components-bundler"] =
      "workspace:*";

    if (pkg.private === true) {
      newPackageData.private = true;
      delete newPackageData["publishConfig"];
    } else {
      newPackageData.publishConfig = {
        access: "public",
      };
    }

    // Adjust React peer dependencies to accepted verisons
    if ("peerDependencies" in newPackageData) {
      if ("react" in newPackageData.peerDependencies) {
        newPackageData.peerDependencies["react"] = "^18.0.0||^19.0.0";
      }
      if ("react-dom" in newPackageData.peerDependencies) {
        newPackageData.peerDependencies["react-dom"] = "^18.0.0||^19.0.0";
      }
    }
    delete newPackageData.targets;

    const outdatedDevDeps = ["vite", "typescript", "parcel"];

    for (const dep of outdatedDevDeps) {
      if (dep in newPackageData.devDependencies) {
        delete newPackageData.devDependencies[dep];
      }
    }

    // Ensure we're using the proper build script
    newPackageData.scripts ??= {};
    newPackageData.scripts.build = "bundle-library .";

    // Sort the package JSON keys alphabetically
    const sortedPackageData: any = {};
    const keys = Object.keys(newPackageData).toSorted((a, b) => {
      const indexA = packageJSONKeyOrder.indexOf(a);
      const indexB = packageJSONKeyOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    for (const key of keys) {
      sortedPackageData[key] = newPackageData[key];
    }

    const newPackageJSONText =
      JSON.stringify(sortedPackageData, null, 2) + "\n";
    if (newPackageJSONText === packageDataText) {
      logSkip("no changes");
      continue;
    }

    writeFileSync(packageJSONPath, newPackageJSONText, "utf-8");
    console.log(prefix + `Updated package.json`);
  }

  console.log("Packages with CSS side effects:");
  for (const pkg of packagesWithCSSSideEffects) {
    console.log(`
\\\\ ${pkg.name}, required from v${pkg.version}
@import("${pkg.name}/${pkg.styleSheetName}");
\\\\    or ${pkg.name}/style.css`);
  }
}

// Run the function
updatePackageJsonFiles();
