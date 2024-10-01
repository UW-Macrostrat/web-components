import * as path from "path";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("../package.json", "utf-8"));

// Web components aliases
let aliases = [];
for (const [key, value] of Object.entries(pkg.alias)) {
  const name = key.replace("@macrostrat/", "");
  const root = path.resolve(
    __dirname,
    "..",
    path.join("packages", name, "src")
  );
  aliases.push({
    find: key + "/src",
    replacement: root,
  });
  aliases.push({
    find: new RegExp(`^${key}$`),
    replacement: root + "/index.ts",
  });
}

console.log(aliases);

export default {
  resolve: {
    conditions: ["typescript"],
    alias: aliases,
  },
  root: path.resolve(__dirname, ".."),
};
