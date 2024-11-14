/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import {
  checkIfPackageCanBePublished,
  notifyUserOfUncommittedChanges,
  getPackageData,
  readProjectPackageJSON,
} from "./status";
import { prepareModule, ensureEntryFilesExist } from "./prepare";
import { publishModule } from "./publish";

export async function runScript({ build = true, publish = true }) {
  let packagesToPublish: any[] = [];

  const { publishedPackages: packages } = readProjectPackageJSON();

  for (const packageName of packages) {
    console.log("\n");
    const pkg = getPackageData(packageName);

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
  // Build the packages that need to be built
  for (const pkg of packagesToPublish) {
    prepareModule(pkg);
  }

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
    console.log(
      chalk.red.bold("Failed to prepare the following packages:"),
      failedPackages.map((pkg) => pkg.name).join(", ")
    );
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
