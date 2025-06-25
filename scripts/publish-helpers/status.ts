/* script to check versions on ui-packages and publish those that aren't on npm */
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { formatDistance } from "date-fns";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import process from "process";
import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(path.join(__dirname, "..", ".."));

// tries to copy this file but in NodeJs
// https://github.com/UW-Macrostrat/python-libraries/blob/main/publish.py

export function setupTerminal() {
  marked.use(markedTerminal());
}

export type PackageJSONData = any;

export function readPackageJSON(dirname): PackageJSONData {
  const pkgPath = path.join(dirname, "package.json");
  return JSON.parse(fs.readFileSync(pkgPath), { encoding: "utf-8" });
}

export function getPackages(...globPatterns: string[]): string[] {
  const packages = [];
  for (const pattern of globPatterns) {
    let paths = globSync(pattern);
    // Remove prefix
    packages.push(...paths);
  }
  // sort packages by name
  packages.sort();

  return packages;
}

export type PackageData = {
  name: string;
  version: string;
  directory: string;
  private?: boolean;
};

export function getPackageDataFromDirectory(pkgDir: string): PackageData {
  const pkg = readPackageJSON(pkgDir);
  return {
    name: pkg.name,
    version: pkg.version,
    directory: pkgDir,
    private: pkg.private,
  };
}

function getPackageDirectory(pkgName) {
  // Remove namespace if it exists
  pkgName = pkgName.split("/").pop();

  const d1 = path.join(projectDir, "packages", pkgName);
  if (fs.existsSync(d1)) return d1;

  const d2 = path.join(projectDir, "toolchain", pkgName);
  if (fs.existsSync(d2)) return d2;

  throw new Error(`Package ${pkgName} not found`);
}

export function logAction(pkg, action, color = chalk.blue) {
  console.log(color.bold(action) + color(`: ` + moduleString(pkg)));
}

function getPackageInfo(pkg) {
  const cmd = `npm info --json ${pkg.name} 2> /dev/null`;
  try {
    return JSON.parse(execSync(cmd).toString());
  } catch (error) {
    return null;
  }
}

/* makes query to npm to see if package with version exists */
async function packageVersionExistsInRegistry(
  pkg,
): Promise<[boolean, string | null]> {
  const info = getPackageInfo(pkg);

  if (info == null) {
    console.log(
      chalk.red("No published version found for " + chalk.bold(pkg.name)),
    );
    return [false, null];
  }

  const currentVersionExists: boolean = info.versions.includes(pkg.version);

  let msg = chalk.bold(moduleString(pkg));
  // Show last version
  const lastVersion: string | null =
    info.versions[info.versions.length - 1] ?? null;
  if (!currentVersionExists) {
    msg += " will be published";
    console.log(chalk.greenBright(msg));
  }

  if (currentVersionExists) {
    // Print the publication date for the version
    const time = getNiceTimeSincePublished(info, pkg.version);
    msg += ` was published ${time}`;
    console.log(chalk.blueBright(msg));
    console.log();
  } else {
    if (lastVersion != null) {
      const time = getNiceTimeSincePublished(info, lastVersion);
      console.log(chalk.dim(`  v${lastVersion} was published ${time}`));
    }

    // Print the changelog entry if it exists
    checkForChangelogEntry(pkg);
  }

  return [currentVersionExists, lastVersion];
}

function getNiceTimeSincePublished(info, version): string {
  const time = info.time[version];

  const now = new Date();
  const then = new Date(time);
  return formatDistance(then, now, { addSuffix: true });
}

function makeRelative(dir) {
  return path.relative(process.cwd(), dir);
}

function buildModuleDiffCommand(pkg, flags = "", tag = null) {
  tag ??= moduleString(pkg, "-v");
  const moduleDir = makeRelative(getPackageDirectory(pkg["name"]));

  return `git diff ${flags} ${tag} -- ${moduleDir}`.replace(/\s+/g, " ");
}

function moduleHasChangesSinceTag(pkg): boolean | null {
  /** Check if a module has changes since the tag matching the current release */
  try {
    execSync(buildModuleDiffCommand(pkg, "--exit-code"), { stdio: "ignore" });
    // if the command exits with 0, there are no changes
    return false;
  } catch (res) {
    if (res.status == 128) {
      // if the command exits with 128, the tag doesn't exist
      console.log(chalk.red(`Tag ${moduleString(pkg)} doesn't exist.`));
      return null;
    }

    return res.status != 0;
  }
}

function printChangeInfoForPublishedPackage(pkg, showChanges = false) {
  const cmd = buildModuleDiffCommand(pkg);
  console.log(chalk.bold(pkg.name), `has changes since v${pkg.version}.`);

  if (showChanges) {
    const cmd = buildModuleDiffCommand(pkg, "--stat --color");
    const res = execSync(cmd).toString();
    console.log(chalk.dim(res));
  }

  console.log("Run the following command to see detailed changes:");
  console.log(chalk.dim(">"), chalk.dim(cmd));
}

/* checks for unstaged changes */
export function gitHasChanges() {
  const gitCmd = "git diff-index HEAD";
  const res = execSync(gitCmd);
  return res.toString().length != 0;
}

export function notifyUserOfUncommittedChanges(raiseError: boolean = true) {
  if (!gitHasChanges()) return;
  console.log(
    chalk.bgRed.bold("Error:"),
    chalk.red.bold("You have uncommitted changes in your git repository."),
  );
  console.log(
    chalk.red("       You must commit or stash them before publishing."),
  );

  if (raiseError) throw new Error("Uncommitted changes in git repository");
}

function moduleString(pkg, separator = "@") {
  return pkg["name"] + separator + pkg["version"];
}

export async function checkIfPackageCanBePublished(
  data: PackageData,
): Promise<boolean> {
  const [isAvailable, lastVersionAvailable] =
    await packageVersionExistsInRegistry(data);
  let canPublish = !isAvailable;

  if (lastVersionAvailable == null) {
    // no published versions
    return canPublish;
  }

  const lastVersionInfo = {
    name: data.name,
    version: lastVersionAvailable,
  };
  const hasChanges = moduleHasChangesSinceTag(lastVersionInfo);

  if (hasChanges != null && hasChanges && !canPublish) {
    // the module code has changed since the current published version
    printChangeInfoForPublishedPackage(lastVersionInfo, true);
  }

  return canPublish;
}

function checkForChangelogEntry(pkg: PackageData) {
  const dir = getPackageDirectory(pkg.name);
  const changelogPath = path.join(dir, "CHANGELOG.md");
  const CHANGELOG = chalk.bold("CHANGELOG");

  if (!fs.existsSync(changelogPath)) {
    console.log(chalk.red(`No ${CHANGELOG} found for ${pkg.name}.`));
    return false;
  }

  const changelog = fs.readFileSync(changelogPath, "utf-8");
  const changelogHeader = `## [${pkg.version}]`;
  const hasChangelogEntry = changelog.includes(changelogHeader);
  if (!hasChangelogEntry) {
    console.log(chalk.red(`No ${CHANGELOG} entry for v${pkg.version}`));
  } else {
    // Snip the changelog entry
    let entry = changelog.split(changelogHeader)[1];
    // Get rid of the rest of the header line
    const entryStart = entry.indexOf("\n") + 1;
    entry = entry.slice(entryStart);

    const nextHeaderIndex = entry.indexOf("\n## [") ?? entry.length;
    entry = entry.slice(0, nextHeaderIndex);
    console.log(chalk.green(`${CHANGELOG} entry for v${pkg.version}:`));
    console.log();
    let formattedEntry = marked(entry);
    // Reduce whitespace in front of lists
    formattedEntry = formattedEntry.replace(/^\s{4}/gm, "");
    // Replace list characters with bullets
    formattedEntry = formattedEntry.replace(/^(\s?)\* /gm, "$1• ");
    formattedEntry = formattedEntry.trim();

    console.log(formattedEntry);
  }

  return hasChangelogEntry;
}
