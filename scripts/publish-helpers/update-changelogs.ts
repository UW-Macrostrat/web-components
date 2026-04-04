/* Script to "seal" changelog entries for publication
by converting them to standard changelog entries with
the version number surrounded by square brackets, and a date.
*/

/** Function to update all package JSON files in a repo to have consistent fields */

// Uses the 'style' field from the package.json to infer whether there is an associated CSS stylesheet

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildComparisonURL,
  getPackageDataFromDirectory,
  getPackages,
  readChangelog,
} from "./status";
import chalk from "chalk";
import { execSync } from "child_process";

export function updateChangelogs() {
  // First, run the changesets script to generate changelogs
  execSync("yarn changeset version", {});

  // Get the root package JSON
  const candidatePackages = getPackages("packages/*", "toolchain/*");
  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);
    if (pkg.private === true) {
      continue;
    }
    console.log(chalk.cyan.bold(`\n${pkg.name}`));

    const changelogText = readChangelog(pkg);
    if (!changelogText) {
      console.error(chalk.red(`No changelog found for ${pkg.name}. Skipping.`));
      continue;
    }

    // First header
    const firstHeaderRow = changelogText.match(
      /^## \[?(?<version>[\d.]+)\]?.*$/m,
    );
    if (!firstHeaderRow) {
      console.error(
        chalk.red(
          `No version header found in ${pkg.name} changelog. Skipping.`,
        ),
      );
      continue;
    }
    const version = firstHeaderRow.groups?.version;
    // Compare version with the latest version in the changelog
    if (pkg.version !== version) {
      console.error(
        chalk.red(
          `Version mismatch in ${pkg.name} changelog. Expected ${pkg.version}, found ${version}. Skipping.`,
        ),
      );
      continue;
    }

    const changelogHeader = firstHeaderRow[0];

    const isSealed = changelogHeader.startsWith("## [");
    if (isSealed) {
      // Find the existing date in the header, if present
      const dateMatch = changelogHeader.match(/\d{4}-\d{2}-\d{2}/);
      const dateExt = dateMatch ? `(${dateMatch[0]})` : "";

      console.log(
        chalk.green.dim(
          `CHANGELOG already sealed for version ${pkg.version} ${dateExt}`,
        ),
      );
      continue;
    }

    const date = new Date().toISOString().split("T")[0];

    let newHeader = `## [${pkg.version}] - ${date}`;

    // Try to get changes since the last release
    const sealedHeaderRegex = /^## \[(?<version>[\d.]+)]?.*$/m;
    const changelogTextBelowCurrentEntry =
      changelogText.split(changelogHeader)[1];
    const versionMatch =
      changelogTextBelowCurrentEntry.match(sealedHeaderRegex);
    if (versionMatch) {
      const lastVersion = versionMatch.groups?.version;
      if (lastVersion) {
        const thisVersionTagName = `${pkg.name}-v${pkg.version}`;
        const lastVersionTagName = `${pkg.name}-v${lastVersion}`;
        // Build Github changes url
        const url = buildComparisonURL(lastVersionTagName, thisVersionTagName);
        newHeader += ` [_changes_](${url})`;
      }
    }

    // Replace the first header with the new one
    const newChangelogText = changelogText.replace(changelogHeader, newHeader);
    writeFileSync(resolve(packageDir, "CHANGELOG.md"), newChangelogText);

    // Proces the changelog with prettier
    execSync(`prettier --write ${resolve(packageDir, "CHANGELOG.md")}`, {});

    console.log(chalk.green(`Sealed CHANGELOG for ${pkg.version}, (${date}))`));
  }
}

// Run the function
updateChangelogs();
