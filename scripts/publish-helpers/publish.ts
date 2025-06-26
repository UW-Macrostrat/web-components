/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { execSync } from "child_process";
import { logAction, PackageData } from "./status";

/* tries to run npm publish and if succeeds adds a tag to the repo*/
export function publishModule(pkg: PackageData) {
  logAction(pkg, "Publishing", chalk.magenta);
  try {
    execSync("yarn npm publish --access public", {
      cwd: pkg.directory,
      stdio: "inherit",
    });
    tagVersion(pkg);
  } catch (error) {
    console.error(`Failed to publish ${moduleString(pkg)}, ${error}`);
  }
}

export function tagVersion(pkg: PackageData) {
  logAction(pkg, "Tagging", chalk.blue);
  const tag = moduleString(pkg, "-v");
  const msg = moduleString(pkg, " version ");
  try {
    execSync(`git tag -a ${tag} -m '${msg}'`, { cwd: pkg.directory });
  } catch (error) {
    console.error(`Failed to tag ${moduleString(pkg)}, ${error}`);
  }
}

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}
