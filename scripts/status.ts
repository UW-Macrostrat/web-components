/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import {
  checkIfPackageCanBePublished,
  notifyUserOfUncommittedChanges,
  getPackageData,
  readProjectPackageJSON,
  setupTerminal,
} from "./publish-helpers";

setupTerminal();

export async function status(exitIfUncommittedChanges = true) {
  let pkgsToPublish = [];

  const { publishedPackages: packages } = readProjectPackageJSON();

  for (const pkg of packages) {
    console.log("\n");
    const data = getPackageData(pkg);

    console.log(chalk.bold.underline(data.name), "\n");
    const canPublish = await checkIfPackageCanBePublished(data);
    if (canPublish) {
      pkgsToPublish.push(pkg);
    }
  }
  console.log();

  if (pkgsToPublish.length === 0) {
    console.log(chalk.magentaBright("All packages published"));
    return;
  }

  notifyUserOfUncommittedChanges(exitIfUncommittedChanges);

  return pkgsToPublish;
}

async function main() {
  await status(false);
}

main();
