/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import { logAction, PackageData } from "./status.js";
export { ensureEntryFilesExist } from "../../toolchain/bundler/src/check-entries";

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
