/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import {
  prepare,
  getPackageDirectory,
  getPackageData,
  logAction,
} from "./prepare";

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

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}

async function main() {
  let pkgsToPublish = prepare();

  pkgsToPublish.forEach((pkg) => {
    const dir = getPackageDirectory(pkg);
    publishModule(dir, pkg);
  });
}

main();
