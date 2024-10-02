/* script to check versions on ui-packages and publish those that aren't on npm */
import axios from "axios";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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
  pkg = getPackageData(pkg);
  logAction(pkg, "Building");
  execSync("yarn run build", { cwd: dir, stdio: "inherit" });
}

/* makes query to npm to see if package with version exists */
async function packageExistsInRegistry(pkg) {
  const name = pkg["name"];
  const version = pkg["version"];
  let exists = false;
  try {
    const res = await axios.get(
      `https://registry.npmjs.org/${name}/${version}`
    );
    exists = res.status == 200;
  } catch {
    exists = false;
  }

  let msg = chalk.bold(moduleString(pkg));
  let color = chalk.greenBright;
  if (!exists) {
    msg += " will be published";
  } else {
    msg += " is already published";
    color = chalk.blueBright;
  }
  console.log(color(msg));

  return exists;
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
  console.log(
    chalk.bold(pkg.name),
    `has uncommitted changes since v${pkg.version}.`
  );

  if (showChanges) {
    const cmd = buildModuleDiffCommand(pkg, "--stat --color");
    const res = execSync(cmd).toString();
    console.log(chalk.dim(res));
  }

  console.log("Run the following command to see detailed changes:");
  console.log(chalk.dim(">"), chalk.dim(cmd));
}

/* checks for unstaged changes */
function gitHasChanges() {
  const gitCmd = "git diff-index HEAD";
  const res = execSync(gitCmd);
  return res.toString().length != 0;
}

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}

export async function prepare() {
  let pkgsToPublish = [];

  const { publishedPackages: packages } = readPackageJSON(projectDir);

  for (const pkg of packages) {
    console.log();
    const isAvailable = await packageExistsInRegistry(getPackageData(pkg));
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
  } else if (gitHasChanges()) {
    console.log(
      chalk.bgRed.bold("Error:"),
      chalk.red.bold("You have uncommitted changes in your git repository.")
    );
    console.log(
      chalk.red("       Please commit or stash them before continuing.")
    );
    return [];
  }

  for (const pkg of pkgsToPublish) {
    const dir = getPackageDirectory(pkg);
    prepareModule(dir, pkg);
  }

  return pkgsToPublish;
}

async function main() {
  await prepare();
}

main();
