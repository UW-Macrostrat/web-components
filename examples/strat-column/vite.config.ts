import { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname } from "path";
import serveStatic from "vite-plugin-serve-static";

const servePatterns = serveStatic([
  {
    pattern: /^\/patterns\/(.+).svg/,
    resolve: (groups) => {
      const pattern = groups[1];
      return `${patternBaseURL}/assets/svg/${pattern}.svg`;
    },
  },
]);

const geologicPatterns = dirname(
  import.meta.resolve("geologic-patterns").replace("file://", ""),
);

const patternBaseURL = geologicPatterns;

const config: UserConfig = {
  resolve: {
    // Allow local resolution of TypeScript packages
    conditions: ["source", "typescript"],
  },
  plugins: [react(), servePatterns],
  server: {},
};

export default config;
