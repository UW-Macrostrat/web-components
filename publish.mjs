/* script to check versions on ui-packages and publish those that aren't on npm */
import fetch, { Headers, Request, Response } from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec, execSync } from "child_process";

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
  exec("npm run build", { cwd: dir });
}

function publishModule(dir) {
  res = exec("npm publish", { cwd: dir });
  if (res.code != 0) {
    console.error(`Failed to publish ${createModuleString(dir)}`);
  }
  const tag = createModuleString(dir);
  const msg = createModuleString(msg);
  exec(`git tag -a ${tag} -m '${msg}'`, { cwd: dir });
}

async function packageExists(pkg) {
  const name = pkg["name"];
  const version = pkg["version"];
  console.log(name, version);
  const res = await fetch(`https://registry.npmjs.org/${name}/${version}`);
  return res.status == 200;
}

// if I don't run refresh I don't see changes
function gitHasChanges() {
  const gitCmd = "git diff-index HEAD";
  const res = execSync(gitCmd);
  return res.toString().length;
}

function createModuleString(dir, long = false) {
  const pkg = fs.readFileSync(dir + "/package.json");
  if (long) return `${pkg["name"]} version ${pkg["version"]}`;
  return `${pkg["name"]} -v ${pkg["version"]}`;
}

async function main() {
  const pkgsToPublish = await packages.reduce(async (acc, pkg) => {
    console.log(acc);
    const exists = await packageExists(getPackageData(pkg));
    if (!exists) return acc.push(pkg);
    return acc;
  }, []);

  if (pkgsToPublish.length === 0) {
    console.log("All packages published");
    return;
  } else if (await gitHasChanges()) {
    console.log(
      "You have uncommitted changes in your git repository. Please commit or stash them before continuing."
    );
    return;
  }

  pkgsToPublish.forEach(pkg => {
    const dir = getPkgDir(pkg);
    prepareModule(dir);
  });

  const msg = "Synced lock files for updated dependencies.";
  exec("git add .");
  exec(`git commit -m '${msg}'`);

  pkgsToPublish.forEach(pkg => {
    const dir = getPkgDir(pkg);
    publishModule(dir);
  });
}

//main();
console.log(gitHasChanges());
