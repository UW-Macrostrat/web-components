import { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function packageSrc(pkg: string) {
  return resolve(`../../packages/${pkg}/src/index.ts`);
}

const config: UserConfig = {
  // override the cache dir because we don't have a node_modules folder with yarn PnP
  // resolve: {
  //   // Allow local resolution of TypeScript packages
  //   conditions: ["source", "typescript"],
  //   alias: {
  //     "@macrostrat/ui-components": packageSrc("ui-components"),
  //     "@macrostrat/column-views": packageSrc("column-views"),
  //     "@macrostrat/column-components": packageSrc("column-components"),
  //   },
  // },
  plugins: [react()],
};

export default config;
