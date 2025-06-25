/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import {
  notifyUserOfUncommittedChanges,
  getPackages,
  getPackageDataFromDirectory,
  getPackagePublicationStatus,
} from "./status";
import { prepareModule, ensureEntryFilesExist } from "./prepare";
import { publishModule } from "./publish";

export async function runScript(
  { prepare = true, build = true, publish = true },
  modules: string[],
) {
  let packagesToPrepare: any[] = [];
  let packagesToBuild: any[] = [];
  let packagesToPublish: any[] = [];
  let packagesInProgress: any[] = [];

  const candidatePackages = getPackages("packages/*", "toolchain/*");
  const privatePackagesSkipped = [];

  if (publish && !prepare) {
    throw new Error(
      "Cannot publish without preparing and building packages first.",
    );
  }

  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);
    if (modules.length > 0 && !modules.includes(pkg.name)) {
      continue;
    }
    if (pkg.private === true) {
      privatePackagesSkipped.push(pkg);
      continue;
    }
    packagesToPrepare.push(pkg);
  }

  // STATUS
  if (prepare) {
    for (const pkg of packagesToPrepare) {
      console.log(chalk.bold.underline(pkg.name));
      const status = await getPackagePublicationStatus(pkg);
      if (status.canPublish) {
        packagesToPublish.push(pkg);
      } else if (status.incomplete) {
        packagesInProgress.push(pkg);
      }
    }

    if (privatePackagesSkipped.length > 0 && modules.length == 0) {
      console.log();
      console.log(chalk.yellow.bold("Skipped private packages:"));
      for (const pkg of privatePackagesSkipped) {
        console.log(chalk.yellow("- " + chalk.bold(pkg.name)));
      }
    }

    if (packagesInProgress.length > 0) {
      console.log();
      console.log(
        chalk.yellow.bold(
          "Some packages require changelog entries before publishing:",
        ),
      );
      for (const pkg of packagesInProgress) {
        console.log(chalk.yellow("- " + chalk.bold(pkg.name)));
      }
      // Exit with non-zero code to indicate incomplete packages
      throw new Error(
        "Incompletely specified packages found. Please add CHANGELOG entries before publishing.",
      );
    }

    if (packagesToPublish.length === 0) {
      console.log(chalk.magentaBright("All packages published"));
      return;
    }

    console.log();
    // Make sure we don't publish if we have uncommitted changes
    // Stop here if we aren't building or publishing
    if (!build && !publish) {
      notifyUserOfUncommittedChanges(false);
      return;
    }

    packagesToBuild = packagesToPublish;
  } else {
    packagesToBuild = packagesToPrepare;
  }

  // We always have to build packages before publishing

  console.log(chalk.blueBright.bold("Preparing packages"));

  let packagesToPush = [];
  let failedPackages = [];

  if (build) {
    for (const pkg of packagesToBuild) {
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
      throw new Error(
        "Some packages failed to build. Please fix the errors and try again.",
      );
    }
  }

  // Check again for uncommitted changes
  notifyUserOfUncommittedChanges(publish);

  if (!publish) {
    return;
  }

  console.log(chalk.blueBright.bold("Publishing packages"));

  // Publish the packages
  for (const pkg of packagesToPush) {
    publishModule(pkg);
  }
}
