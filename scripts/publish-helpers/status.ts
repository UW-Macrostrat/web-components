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
  return JSON.parse(fs.readFileSync(pkgPath, { encoding: "utf-8" }));
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

const registryIndex = new Map();

function getAllPackagesInfoFromRegistry() {
  /** Get info for all packages in the registry and cache it */
  if (registryIndex.size > 0) {
    return registryIndex;
  }

  const cmd = `npm info --json --workspaces . 2> /dev/null`;
  let resJSON = {};
  try {
    const res = execSync(cmd, { encoding: "utf-8", cwd: projectDir });
    console.log(res);
    resJSON = JSON.parse(res);
  } catch (error) {
    // Sometimes it errors because we are not logged in to get info on private packages
    // If there is salvageable JSON, use it
    resJSON = JSON.parse(error.stdout);
  }

  for (const [pkgName, pkgInfo] of Object.entries<any>(resJSON)) {
    if (pkgName == "error") continue;
    registryIndex.set(pkgName, pkgInfo);
  }

  return registryIndex;
}

interface PackageInfo {
  versions: string[];
  lastVersion: string;
}

function getPackageInfo(pkg): PackageInfo | null {
  const packageIndex = getAllPackagesInfoFromRegistry();
  try {
    return packageIndex.get(pkg.name) ?? null;
  } catch (error) {
    return null;
  }
}

export interface PackageStatus {
  currentVersionExistsInRegistry: boolean;
  currentVersionChangelogEntry: string | null;
  lastVersion: string | null;
  canPublish: boolean;
  incomplete: boolean; // whether the package is incomplete (no changelog entry)
  hasChangesSinceLastVersion?: boolean | null; // whether the package has changes since the last version
}

export async function getPackagePublicationStatus(
  data: PackageData,
): Promise<PackageStatus> {
  const info = await packageVersionExistsInRegistry(data);

  printChangelogStatus(data, info);

  const hasChanges = info.hasChangesSinceLastVersion;

  if (hasChanges != null && hasChanges) {
    // the module code has changed since the current published version
    // We need to print this version.
    printChangeInfoForPublishedPackage(
      { name: data.name, version: info.lastVersion },
      true,
    );
  }

  return info;
}

/* makes query to npm to see if package with version exists */
async function packageVersionExistsInRegistry(pkg): Promise<PackageStatus> {
  const info = getPackageInfo(pkg);

  let currentVersionExistsInRegistry: boolean = false;
  if (info == null) {
    console.log(
      chalk.red("No published version found for " + chalk.bold(pkg.name)),
    );
  }

  currentVersionExistsInRegistry =
    info?.versions.includes(pkg.version) ?? false;

  let currentVersionChangelogEntry: string | null = null;
  if (!currentVersionExistsInRegistry) {
    currentVersionChangelogEntry = getChangelogEntry(pkg);
  }

  const canPublish =
    !currentVersionExistsInRegistry && currentVersionChangelogEntry != null;

  const incomplete = !currentVersionExistsInRegistry && !canPublish;

  let msg = chalk.bold(moduleString(pkg));
  // Show last version
  const lastVersion: string | null =
    info.versions[info.versions.length - 1] ?? null;
  if (canPublish) {
    msg += " will be published";
    console.log(chalk.greenBright(msg));
  }

  if (currentVersionExistsInRegistry) {
    // Print the publication date for the version
    const time = getNiceTimeSincePublished(info, pkg.version);
    msg += ` was published ${time}`;
    console.log(chalk.blueBright(msg));
    console.log();
  } else if (lastVersion != null) {
    const time = getNiceTimeSincePublished(info, lastVersion);
    console.log(chalk.dim(`  v${lastVersion} was published ${time}`));
  }

  let hasChanges: boolean | null = null;
  if (lastVersion != null) {
    hasChanges = moduleHasChangesSinceTag({
      name: pkg.name,
      version: lastVersion,
    });
  }

  return {
    currentVersionExistsInRegistry,
    currentVersionChangelogEntry,
    lastVersion,
    canPublish,
    incomplete,
    hasChangesSinceLastVersion: hasChanges,
  };
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
    fetchTagIfNotExistsLocally(pkg);

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

function fetchTagIfNotExistsLocally(pkg) {
  /** Fetch the tag from the remote if it doesn't exist locally */
  const tag = moduleString(pkg, "-v");

  // Check if the tag exists locally
  const localTag = execSync(`git tag --list ${tag}`).toString().trim();
  if (localTag !== "") {
    return;
  }

  const cmd = `git fetch origin tag ${tag} --no-tags`;
  try {
    execSync(cmd, { stdio: "ignore" });
  } catch (error) {
    // If the tag doesn't exist, this will throw an error
    if (error.status === 128) {
      console.log(chalk.red(`Tag ${tag} does not exist on remote.`));
    }
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
  console.log(chalk.dim(cmd));

  // Check if is synced with the remote
  // TODO: this only works if the current branch is pushed to the remote
  console.log("or view the changes in GitHub:");
  const repoUrl = "https://github.com/UW-Macrostrat/web-components";
  const tag = moduleString(pkg, "-v");
  // Get head commit hash
  const headCommit = execSync("git rev-parse HEAD").toString().trim();
  const url = `${repoUrl}/compare/${tag}...${headCommit}`;
  console.log(chalk.dim(url));
  console.log("");
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

function printChangelogStatus(pkg: PackageData, info: PackageStatus): void {
  /** Print the status of the changelog for a package */
  const dir = getPackageDirectory(pkg.name);
  const CHANGELOG = chalk.bold("CHANGELOG");

  if (info.currentVersionExistsInRegistry) {
    // No need to print changelog if the current version exists in the registry
    return;
  }

  const changelog = info.currentVersionChangelogEntry;
  if (changelog != null) {
    console.log(chalk.green(`${CHANGELOG} entry for v${pkg.version}:`));
    console.log(changelog + "\n");
  } else {
    console.log(chalk.red(`No ${CHANGELOG} entry for v${pkg.version}`));
  }
}

function getChangelogEntry(pkg: PackageData): string | null {
  /** Check whether the package has a changelog entry for the current version
   */

  const dir = getPackageDirectory(pkg.name);
  const changelogPath = path.join(dir, "CHANGELOG.md");
  const CHANGELOG = chalk.bold("CHANGELOG");

  const changelog = fs.readFileSync(changelogPath, "utf-8");
  const changelogHeader = `## [${pkg.version}]`;
  const hasChangelogEntry = changelog.includes(changelogHeader);
  if (!hasChangelogEntry) {
    return null;
  }
  // Snip the changelog entry
  let entry = changelog.split(changelogHeader)[1];
  // Get rid of the rest of the header line
  const entryStart = entry.indexOf("\n") + 1;
  entry = entry.slice(entryStart);

  const nextHeaderIndex = entry.indexOf("\n## [") ?? entry.length;
  entry = entry.slice(0, nextHeaderIndex);
  let formattedEntry = marked(entry) as string;
  // Reduce whitespace in front of lists
  formattedEntry = formattedEntry.replace(/^\s{4}/gm, "");
  // Replace list characters with bullets
  formattedEntry = formattedEntry.replace(/^(\s?)\* /gm, "$1• ");
  formattedEntry = formattedEntry.trim();
  return formattedEntry;
}
