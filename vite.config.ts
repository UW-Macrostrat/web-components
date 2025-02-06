import { defineConfig } from "vite";

// List all folders in packages/
import fs from "fs";
import path from "path";

const packages = fs
  .readdirSync("packages")
  .filter((d) => fs.statSync(path.join("packages", d)).isDirectory())
  .map((d) => `@macrostrat/${d}`);

console.log(packages);

export default defineConfig({
  resolve: {
    conditions: ["typescript"],
    dedupe: [...packages, "react", "react-dom"],
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
