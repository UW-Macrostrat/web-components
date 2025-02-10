import { defineConfig } from "vite";
import { resolve } from "path";

// List all folders in packages/
import fs from "fs";
import path from "path";

const packages = fs
  .readdirSync("packages")
  .filter((d) => fs.statSync(path.join("packages", d)).isDirectory());
// .map((d) => `@macrostrat/${d}`);

let alias = {};

for (const pkg of packages) {
  alias["@macrostrat/" + pkg] = resolve(`packages/${pkg}/src/index.ts`);
}

console.log(packages);

export default defineConfig({
  optimizeDeps: {
    include: ["storybook-dark-mode"],
  },
  // Resolve dependencies with the "typescript" entry point
  resolve: {
    conditions: ["typescript"],
    //alias,
  },
  css: {
    preprocessorOptions: {
      // https://vite.dev/config/shared-options.html#css-preprocessoroptions
      sass: {
        api: "modern-compiler", // or "modern", "legacy"
      },
    },
  },
});
