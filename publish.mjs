/* script to check versions on ui-packages and publish those that aren't on npm */
import fetch, { Headers, Request, Response } from "node-fetch";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

const packages = ["ui-components"];

function getPackageData(pkgName) {
  const path_ = getPkgDir(pkgName);
  const pkgData = fs.readFileSync(path_ + "/package.json");
  return JSON.parse(pkgData);
}

function getPkgDir(pkgName) {
  return path.join(__dirname + "/packages/" + `${pkgName}`);
}

function prepareModule(dir) {
  console.log(chalk.blue.bold(`Building`), chalk.blue(` : ${dir}`));
  //exec("npm run build", { cwd: dir });
}

function publishModule(dir) {
  console.log(chalk.magenta.bold("Publishing"), chalk.magenta(`: ${dir}`));
  // res = exec("npm publish", { cwd: dir });
  // if (res.code != 0) {
  //   console.error(`Failed to publish ${createModuleString(dir)}`);
  // }
  // const tag = createModuleString(dir);
  // const msg = createModuleString(msg);
  // exec(`git tag -a ${tag} -m '${msg}'`, { cwd: dir });
}

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

  return res.status == 200;
}

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
      return acc.push(pkg);
    }
    return acc;
  }, []);

  if (pkgsToPublish.length === 0) {
    console.log(chalk.magentaBright("All packages published"));
    return;
  } else if (gitHasChanges()) {
    console.log(
      chalk.bgRed(
        "You have uncommitted changes in your git repository. Please commit or stash them before continuing."
      )
    );
    return;
  }

  pkgsToPublish.forEach(pkg => {
    const dir = getPkgDir(pkg);
    prepareModule(dir);
  });

  const msg = "Synced lock files for updated dependencies.";
  // execSync("git add .");
  // execSync(`git commit -m '${msg}'`);

  pkgsToPublish.forEach(pkg => {
    const dir = getPkgDir(pkg);
    publishModule(dir);
  });
}

main();
