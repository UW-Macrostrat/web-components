/* script to check versions on ui-packages and publish those that aren't on npm */
import { runScript, tagVersions } from "./run-script";
import { setupTerminal } from "./status";
import chalk from "chalk";

async function main() {
  setupTerminal();

  let argv = process.argv.slice(2);

  let op = "status";
  let modules = [];

  if (argv.length >= 1) {
    [op, ...modules] = argv;
  }

  if (op === "status") {
    await runScript({ build: false, publish: false }, modules);
  } else if (op === "prepare") {
    await runScript({ build: true, publish: false }, modules);
  } else if (op === "publish") {
    await runScript({ build: true, publish: true }, modules);
  } else if (op === "publish-only") {
    await runScript({ prepare: true, build: false, publish: true }, modules);
  } else if (op === "build") {
    await runScript({ prepare: false, build: true, publish: false }, modules);
  } else if (op === "tag-versions") {
    tagVersions(modules);
  } else {
    console.log("Invalid operation. Use 'status', 'prepare', or 'publish'");
  }
}

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.log();
    console.error(chalk.bold.red(error));
    process.exit(1);
  });
