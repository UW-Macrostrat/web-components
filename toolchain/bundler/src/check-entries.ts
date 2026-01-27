import { existsSync } from "fs";
import fs from "fs";
import path from "path";

export type PackageData = {
  name: string;
  version: string;
  directory: string;
  private?: boolean;
};

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

  for (const entry in ["source", "types", "style", "typings", "node"]) {
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

  let entryFile = `${baseDir}/${entry}`;
  entryFile = entryFile.replace(/^\.?\//, "");

  if (!existsSync(entryFile)) {
    throw new Error(`Entry file ${entryFile} does not exist`);
  }
}

/* script to check versions on ui-packages and publish those that aren't on npm */

export type PackageJSONData = any;

export function readPackageJSON(dirname): PackageJSONData {
  const pkgPath = path.join(dirname, "package.json");
  return JSON.parse(fs.readFileSync(pkgPath, { encoding: "utf-8" }));
}
