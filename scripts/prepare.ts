/* script to check versions on ui-packages and publish those that aren't on npm */
import axios from "axios";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { formatDistance } from "date-fns";
import { normalizeInterval } from "date-fns/_lib/normalizeInterval";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(path.join(__dirname, ".."));

// tries to copy this file but in NodeJs
// https://github.com/UW-Macrostrat/python-libraries/blob/main/publish.py

function readPackageJSON(dirname) {
  const pkgPath = path.join(dirname, "package.json");
  return JSON.parse(fs.readFileSync(pkgPath));
}

type PackageData = {
  name: string;
  version: string;
};

/* get package.json filr from correct dir */
export function getPackageData(pkgName: string): PackageData {
  const rootDir = getPackageDirectory(pkgName);
  return readPackageJSON(rootDir);
}

export function getPackageDirectory(pkgName) {
  // Remove namespace if it exists
  pkgName = pkgName.split("/").pop();

  return path.join(projectDir, "packages", pkgName);
}

export function logAction(pkg, action, color = chalk.blue) {
  console.log(color.bold(action) + color(`: ` + moduleString(pkg)));
}

/* Runs, npm build in the correct pkg directory*/
function prepareModule(dir, pkg) {
  const pkgData = getPackageData(pkg);
  logAction(pkgData, "Building");
  try {
    execSync(`yarn workspace ${pkgData.name} run build`, {
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    console.log(chalk.red(`Failed to build ${pkgData.name}`));
    console.log(error);
    process.exit(1);
  }
}

function getPackageInfo(pkg) {
  const cmd = "npm info --json " + pkg.name;
  try {
    return JSON.parse(execSync(cmd).toString());
  } catch (error) {
    return null;
  }
}

/* makes query to npm to see if package with version exists */
async function packageVersionExistsInRegistry(pkg) {
  const info = getPackageInfo(pkg);

  if (info == null) {
    console.log(chalk.red(`Failed to get info for ${moduleString(pkg)}`));
    return false;
  }

  const exists = info.versions.includes(pkg.version);

  let msg = chalk.bold(moduleString(pkg));
  if (!exists) {
    msg += " will be published";
    console.log(chalk.greenBright(msg));

    // Show last version
    const lastVersion = info.versions[info.versions.length - 1];
    if (lastVersion) {
      const time = getNiceTimeSincePublished(info, lastVersion);
      console.log(chalk.dim(`Version ${lastVersion} was published ${time}`));
    }
  } else {
    // Print the publication date for the version
    const time = getNiceTimeSincePublished(info, pkg.version);
    msg += ` was published ${time}`;
    console.log(chalk.blueBright(msg));
  }

  return exists;
}

function getNiceTimeSincePublished(info, version): string {
  const time = info.time[version];

  const now = new Date();
  const then = new Date(time);
  return formatDistance(then, now, { addSuffix: true });
}

function makeRelative(dir) {
  return path.relative(process.cwd(), dir);
}

function buildModuleDiffCommand(pkg, flags = "") {
  const tag = moduleString(pkg, "-v");
  const moduleDir = makeRelative(getPackageDirectory(pkg["name"]));

  return `git diff ${flags} ${tag} -- ${moduleDir}`.replace(/\s+/g, " ");
}

function moduleHasChangesSinceTag(pkg) {
  /** Check if a module has changes since the tag matching the current release */
  try {
    execSync(buildModuleDiffCommand(pkg, "--exit-code"));
    // if the command exits with 0, there are no changes
  } catch (res) {
    if (res.status == 128) {
      // if the command exits with 128, the tag doesn't exist
      console.log(chalk.red(`Tag ${moduleString(pkg)} doesn't exist.`));
    }

    return res.status != 0;
  }
}

function printChangeInfoForPublishedPackage(pkg, showChanges = false) {
  const cmd = buildModuleDiffCommand(pkg);
  console.log(chalk.bold(pkg.name), `has changes since v${pkg.version}.`);

  if (showChanges) {
    const cmd = buildModuleDiffCommand(pkg, "--stat --color");
    const res = execSync(cmd).toString();
    console.log(chalk.dim(res));
  }

  console.log("Run the following command to see detailed changes:");
  console.log(chalk.dim(">"), chalk.dim(cmd));
}

/* checks for unstaged changes */
export function gitHasChanges() {
  const gitCmd = "git diff-index HEAD";
  const res = execSync(gitCmd);
  return res.toString().length != 0;
}

export function notifyUserOfUncommittedChanges(raiseError: boolean = true) {
  if (!gitHasChanges()) return;
  console.log(
    chalk.bgRed.bold("Error:"),
    chalk.red.bold("You have uncommitted changes in your git repository.")
  );
  console.log(
    chalk.red("       You must commit or stash them before publishing.")
  );

  if (raiseError) throw new Error("Uncommitted changes in git repository");
}

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}

export async function prepare(exitIfUncommittedChanges = true) {
  let pkgsToPublish = [];

  const { publishedPackages: packages } = readPackageJSON(projectDir);

  for (const pkg of packages) {
    console.log();
    const isAvailable = await packageVersionExistsInRegistry(
      getPackageData(pkg)
    );
    if (!isAvailable) {
      pkgsToPublish.push(pkg);
      continue;
    }

    const hasChanges = moduleHasChangesSinceTag(getPackageData(pkg));
    if (hasChanges) {
      // the module code has changed since the current published version
      printChangeInfoForPublishedPackage(getPackageData(pkg), true);
    }
  }

  console.log();

  if (pkgsToPublish.length === 0) {
    console.log(chalk.magentaBright("All packages published"));
    return;
  }

  notifyUserOfUncommittedChanges(exitIfUncommittedChanges);

  //process.env.NODE_NO_WARNINGS = "1";
  for (const pkg of pkgsToPublish) {
    console.log();
    const dir = getPackageDirectory(pkg);
    prepareModule(dir, pkg);
  }

  return pkgsToPublish;
}

async function main() {
  await prepare(false);
}

main();
