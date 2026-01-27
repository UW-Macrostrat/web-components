/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { PackageData } from "./status.js";
import { readPackageJSON } from "../../toolchain/bundler/src/check-entries";
import { exec } from "child_process";
import { bundleLibrary } from "../../toolchain/bundler/src/index.ts";

/* Runs, npm build in the correct pkg directory*/
export async function prepareModule(pkg: PackageData) {
  const def = readPackageJSON(pkg.directory);

  if (def.scripts == null || def.scripts.build == null) {
    console.log(
      chalk.yellow(
        `Package ${pkg.name} does not have a build script. Skipping build step.`,
      ),
    );
    return;
  }

  if (
    def.scripts.build.startsWith("bundle-library ") ||
    def.scripts.build.startsWith("vite build ")
  ) {
    await bundleLibrary(pkg.directory);
  } else {
    await execCommand(`yarn workspace ${pkg.name} run build`, {
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 20,
    });
  }
}

async function execCommand(command: string, opts: any = {}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    exec(command, opts, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
}
