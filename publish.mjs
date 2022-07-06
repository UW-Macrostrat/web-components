/* script to check versions on ui-packages and publish those that aren't on npm */
import fetch, { Headers, Request, Response } from "node-fetch";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// tries to copy this file but in NodeJs
// https://github.com/UW-Macrostrat/python-libraries/blob/main/publish.py

/* need this for fetching in node */
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

const packages = ["ui-components"];

/* get package.json filr from correct dir */
function getPackageData(pkgName) {
  const path_ = getPkgDir(pkgName);
  const pkgData = fs.readFileSync(path_ + "/package.json");
  return JSON.parse(pkgData);
}

function getPkgDir(pkgName) {
  return path.join(__dirname + "/packages/" + `${pkgName}`);
}

/* Runs, npm build in the correct pkg directory*/
function prepareModule(dir, pkg) {
  pkg = getPackageData(pkg);
  console.log(
    chalk.blue.bold(`Building`) +
      chalk.blueBright(`: ${pkg["name"]}@${pkg["version"]}`)
  );
  execSync("npm run build", { cwd: dir, stdio: "inherit" });
}

/* tries to run npm publish and if succeeds adds a tag to the repo*/
function publishModule(dir, pkg) {
  pkg = getPackageData(pkg);
  console.log(
    chalk.magenta.bold("Publishing") +
      chalk.magenta(`: ${pkg["name"]}@${pkg["version"]}`)
  );
  try {
    execSync("npm publish", { cwd: dir, stdio: "inherit" });
    console.log(chalk.blueBright.bold("Creating version tag"));
    const tag = `v${pkg["version"]}`;
    const msg = `${pkg["name"]} version ${pkg["version"]}`;
    execSync(`git tag -a ${tag} -m '${msg}'`, { cwd: dir });
  } catch (error) {
    console.error(`Failed to publish ${createModuleString(dir)}, ${error}`);
  }
}

/* makes query to npm to see if package with version exists */
async function packageExists(pkg) {
  const name = pkg["name"];
  const version = pkg["version"];
  const res = await fetch(`https://registry.npmjs.org/${name}/${version}`);
  const exists = res.status == 200;
  if (!exists) {
    console.log(
      chalk.greenBright(`${pkg["name"]}@${pkg["version"]} will be published`)
    );
  } else {
    console.log(
      chalk.blueBright(
        `${pkg["name"]}@${pkg["version"]} is already published on npm`
      )
    );
  }

  return exists;
}

/* checks for unstaged changes */
function gitHasChanges() {
  const gitCmd = "git diff-index HEAD";
  const res = execSync(gitCmd);
  return res.toString().length != 0;
}

function createModuleString(dir, long = false) {
  const pkg = fs.readFileSync(dir + "/package.json");
  if (long) return `${pkg["name"]} version ${pkg["version"]}`;
  return `${pkg["name"]} -v ${pkg["version"]}`;
}

async function main() {
  const pkgsToPublish = await packages.reduce(async (acc, pkg) => {
    const exists = await packageExists(getPackageData(pkg));
    if (!exists) {
      acc.push(pkg);
      return acc;
    }
    return acc;
  }, []);

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
  pkgsToPublish.map(pkg => {
    const dir = getPkgDir(pkg);
    prepareModule(dir, pkg);
  });

  pkgsToPublish.forEach(pkg => {
    const dir = getPkgDir(pkg);
    publishModule(dir, pkg);
  });
}

main();
