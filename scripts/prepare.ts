/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import {
  status,
  logAction,
  getPackageDirectory,
  getPackageData,
} from "./status";

/* Runs, npm build in the correct pkg directory*/
function prepareModule(dir, pkg) {
  const pkgData = getPackageData(pkg);
  logAction(pkgData, "Building");
  try {
    execSync(`yarn workspace ${pkgData.name} run build`, {
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 20,
    });
  } catch (error) {
    console.log(chalk.red(`Failed to build ${pkgData.name}`));
    console.log(error);
    process.exit(1);
  }
}

export async function prepare(exitIfUncommittedChanges = true) {
  const packagesToPublish = (await status(exitIfUncommittedChanges)) ?? [];

  //process.env.NODE_NO_WARNINGS = "1";
  for (const pkg of packagesToPublish) {
    console.log();
    const dir = getPackageDirectory(pkg);
    prepareModule(dir, pkg);
  }

  return packagesToPublish;
}

async function main() {
  await prepare(false);
}

main();
