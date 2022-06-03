/* script to check versions on ui-packages and publish those that aren't on npm */
import fetch, { Headers, Request, Response } from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

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
  const path_ = path.join(__dirname + "/packages/" + `${pkgName}`);
  const pkgData = fs.readFileSync(path_ + "/package.json");
  return JSON.parse(pkgData);
}

async function packageExists(pkg) {
  const name = pkg["name"];
  const version = pkg["version"];
  console.log(name, version);
  const res = await fetch(`https://registry.npmjs.org/${name}/${version}`);
  return res.status == 200;
}

function gitHasChanges() {
  const gitCmd = "git diff-index --quiet HEAD --";
  exec("git diff", function(err, stdout, stderr) {
    console.log(stdout == "");
  });
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
  }
}
gitHasChanges();
//main();
