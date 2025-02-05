/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import {
  checkIfPackageCanBePublished,
  notifyUserOfUncommittedChanges,
  getPackages,
  getPackageDataFromDirectory,
} from "./status";
import { prepareModule, ensureEntryFilesExist } from "./prepare";
import { publishModule } from "./publish";

export async function runScript(
  { build = true, publish = true },
  modules: string[]
) {
  let packagesToPublish: any[] = [];

  const candidatePackages = getPackages("packages/*", "toolchain/*");

  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);

    if (modules.length > 0 && !modules.includes(pkg.name)) {
      continue;
    }
    console.log("\n");

    console.log(chalk.bold.underline(pkg.name), "\n");
    const canPublish = await checkIfPackageCanBePublished(pkg);
    if (canPublish) {
      packagesToPublish.push(pkg);
    }
  }
  console.log();

  if (packagesToPublish.length === 0) {
    console.log(chalk.magentaBright("All packages published"));
    return;
  }

  // Make sure we don't publish if we have uncommitted changes
  notifyUserOfUncommittedChanges(publish);
  // Stop here if we aren't building or publishing
  if (!build && !publish) {
    return;
  }

  console.log(chalk.blueBright.bold("Preparing packages"));

  let packagesToPush = [];
  let failedPackages = [];

  for (const pkg of packagesToPublish) {
    try {
      prepareModule(pkg);
      ensureEntryFilesExist(pkg);
      packagesToPush.push(pkg);
    } catch (error) {
      console.log(error);
      failedPackages.push(pkg);
    }
  }

  if (failedPackages.length > 0) {
    console.log();
    console.log(chalk.red.bold("Failed to prepare the following packages:"));
    for (const pkg of failedPackages) {
      console.log(chalk.red("- " + chalk.bold(pkg.name)));
    }
    return;
  }

  // Check again for uncommitted changes
  notifyUserOfUncommittedChanges(true);

  if (!publish) {
    return;
  }

  console.log(chalk.blueBright.bold("Publishing packages"));

  // Publish the packages
  for (const pkg of packagesToPush) {
    publishModule(pkg);
  }
}
