/* script to check versions on ui-packages and publish those that aren't on npm */
import { runScript } from "./run-script";
import { setupTerminal } from "./status";

async function main() {
  setupTerminal();

  let argv = process.argv.slice(2);

  let op = "status";

  if (argv.length == 1) {
    op = argv[0];
  }

  if (op === "status") {
    await runScript({ build: false, publish: false });
  } else if (op === "prepare") {
    await runScript({ build: true, publish: false });
  } else if (op === "publish") {
    await runScript({ build: true, publish: true });
  } else {
    console.log("Invalid operation. Use 'status', 'prepare', or 'publish'");
  }
}

main().then(() => {
  console.log("Done");
});
