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

const packages = ["ui-components", "mapbox-utils", "mapbox-react"];

/* get package.json filr from correct dir */
function getPackageData(pkgName) {
  const rootDir = getPkgDir(pkgName);
  const pkgData = fs.readFileSync(path.join(rootDir, "package.json"));
  return JSON.parse(pkgData);
}

function getPkgDir(pkgName) {
  return path.join(projectDir, "packages", pkgName);
}

function logAction(pkg, action, color = chalk.blue) {
  console.log(color.bold(action) + color(`: ` + moduleString(pkg)));
}

/* Runs, npm build in the correct pkg directory*/
function prepareModule(dir, pkg) {
  pkg = getPackageData(pkg);
  logAction(pkg, "Building");
  execSync("yarn run build", { cwd: dir, stdio: "inherit" });
}

/* tries to run npm publish and if succeeds adds a tag to the repo*/
function publishModule(dir, pkg) {
  pkg = getPackageData(pkg);
  logAction(pkg, "Publishing", chalk.magenta);
  try {
    execSync("yarn npm publish --access public", {
      cwd: dir,
      stdio: "inherit",
    });
    console.log(chalk.blueBright.bold("Tagging version"));
    const tag = moduleString(pkg, "-v");
    const msg = moduleString(pkg, " version ");
    execSync(`git tag -a ${tag} -m '${msg}'`, { cwd: dir });
  } catch (error) {
    console.error(`Failed to publish ${moduleString(pkg)}, ${error}`);
  }
}

/* makes query to npm to see if package with version exists */
async function packageExists(pkg) {
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

  let msg = moduleString(pkg);
  let color = chalk.greenBright;
  if (!exists) {
    msg += " will be published";
  } else {
    msg += " is already published on npm";
    color = chalk.blueBright;
  }
  console.log(color(msg));

  return exists;
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

async function main() {
  let pkgsToPublish = [];

  for (const pkg of packages) {
    const isAvailable = await packageExists(getPackageData(pkg));
    if (!isAvailable) {
      pkgsToPublish.push(pkg);
    }
  }

  if (pkgsToPublish.length === 0) {
    console.log(chalk.magentaBright("All packages published"));
    return;
  } else if (gitHasChanges()) {
    console.log(chalk.red.bold("Error: "));
    console.log(
      chalk.bgRed("You have uncommitted changes in your git repository.")
    );
    console.log(chalk.bgRed("Please commit or stash them before continuing."));
    return;
  }
  pkgsToPublish.map((pkg) => {
    const dir = getPkgDir(pkg);
    prepareModule(dir, pkg);
  });

  pkgsToPublish.forEach((pkg) => {
    const dir = getPkgDir(pkg);
    publishModule(dir, pkg);
  });
}

main();
