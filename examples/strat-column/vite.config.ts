import { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function packageSrc(pkg: string) {
  return resolve(`../../packages/${pkg}/src/index.ts`);
}

const config: UserConfig = {
  resolve: {
    // Allow local resolution of TypeScript packages
    conditions: ["source", "typescript"],
    dedupe: ["react", "react-dom"],
    alias: {
      "@macrostrat/ui-components": packageSrc("ui-components"),
      "@macrostrat/column-views": packageSrc("column-views"),
      "@macrostrat/column-components": packageSrc("column-components"),
    },
  },
  plugins: [react()],
};

export default config;
