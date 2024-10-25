/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import {
  status,
  getPackageDirectory,
  getPackageData,
  logAction,
} from "./status";
import { prepareModule } from "./prepare";

/* tries to run npm publish and if succeeds adds a tag to the repo*/
function publishModule(dir, pkg) {
  const pkgData = getPackageData(pkg);
  logAction(pkgData, "Publishing", chalk.magenta);
  try {
    execSync("yarn npm publish --access public", {
      cwd: dir,
      stdio: "inherit",
    });
    console.log(chalk.blueBright.bold("Tagging version"));
    const tag = moduleString(pkgData, "-v");
    const msg = moduleString(pkgData, " version ");
    execSync(`git tag -a ${tag} -m '${msg}'`, { cwd: dir });
  } catch (error) {
    console.error(`Failed to publish ${moduleString(pkgData)}, ${error}`);
  }
}

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}

async function main() {
  let pkgsToPublish = (await status()) ?? [];

  for (const pkg of pkgsToPublish) {
    const dir = getPackageDirectory(pkg);
    prepareModule(dir, pkg);
    publishModule(dir, pkg);
  }
}

main();
