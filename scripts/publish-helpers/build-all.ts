/* script to check versions on ui-packages and publish those that aren't on npm */
import chalk from "chalk";
import { getPackages, getPackageDataFromDirectory } from "./status";
import { prepareModule } from "./prepare";

export async function buildAll() {
  // Build the bundler first

  const candidatePackages = getPackages("packages/*", "toolchain/*");

  const successes = [];
  const failures = [];

  for (const packageDir of candidatePackages) {
    const pkg = getPackageDataFromDirectory(packageDir);
    try {
      await prepareModule(pkg);
      successes.push(pkg);
    } catch (e) {
      failures.push({ pkg, error: e });
    }
  }

  console.log();
  console.log(chalk.bold("Build Summary"));

  if (successes.length > 0) {
    console.log(
      chalk.green(`Successfully built ${successes.length} packages:`),
    );
    for (const pkg of successes) {
      console.log(chalk.green(`- ${pkg.name}`));
    }
  }
  if (failures.length > 0) {
    console.log(chalk.red(`\nFailed to build ${failures.length} packages:`));
    for (const failure of failures) {
      console.log(
        chalk.red(
          `- ${chalk.bold(failure.pkg.name)}\n  ${chalk.dim(failure.error.message)}`,
        ),
      );
    }
    throw new Error("Some packages failed to build.");
  }
}

buildAll().catch((err) => {
  console.error(chalk.red.bold("\nError: ") + chalk.red(err.message));
  process.exit(1);
});
