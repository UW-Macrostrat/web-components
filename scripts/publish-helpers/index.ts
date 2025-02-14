/* script to check versions on ui-packages and publish those that aren't on npm */
import { runScript } from "./run-script";
import { setupTerminal } from "./status";

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
  } else {
    console.log("Invalid operation. Use 'status', 'prepare', or 'publish'");
  }
}

main().then(() => {
  console.log("Done");
});
