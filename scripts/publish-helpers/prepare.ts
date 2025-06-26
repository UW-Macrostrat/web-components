/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import { logAction, PackageData, readPackageJSON } from "./status";
import { existsSync } from "fs";

/* Runs, npm build in the correct pkg directory*/
export function prepareModule(pkg: PackageData) {
  logAction(pkg, "Building");
  try {
    // Clean the dist directory
    execSync(`rm -rf ${pkg.directory}/dist`, {
      stdio: "inherit",
    });

    execSync(`yarn workspace ${pkg.name} run build`, {
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 20,
    });
  } catch (error) {
    console.log(chalk.red(`Failed to build ${pkg.name}`));
    console.log(error);
    throw error;
  }
}

export function ensureEntryFilesExist(pkg: PackageData) {
  // Check if the entry files exist for a package
  const pkgJSON = readPackageJSON(pkg.directory);

  // The 'main' entry must exist in all circumstances
  checkExists(pkg.directory, pkgJSON, "main", true);
  if (pkgJSON.module != null) {
    if (pkgJSON.type == "module") {
      throw new Error(`Package ${pkg.name} has a superfluous 'module' field`);
    }
    checkExists(pkg.directory, pkgJSON, "module", false);
  }

  for (const entry in ["source", "types", "style", "typings"]) {
    checkExists(pkg.directory, pkgJSON, entry, false);
  }

  // Check the nested `exports` field
  checkExists(pkg.directory, pkgJSON, "exports", false, true);
}

function checkExists(
  baseDir: string,
  pkg: any,
  key: string,
  required: boolean,
  allowNested = false,
) {
  let entry = pkg[key];
  if (entry == null && required) {
    throw new Error(`Package ${pkg.name} does not have a ${entry} entry file`);
  }
  if (entry == null) return;

  if (typeof entry !== "string" && allowNested) {
    for (const key in entry) {
      checkExists(baseDir, entry, key, required, true);
    }
    return;
  }

  const entryFile = `${baseDir}/${entry}`;
  if (!existsSync(entryFile)) {
    throw new Error(`Entry file ${entryFile} does not exist`);
  }
}
