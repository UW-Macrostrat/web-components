import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const require = createRequire(import.meta.url);

export default {
  // vite
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(mdx|js|jsx|ts|tsx)",
    "../packages/*/src/**/*.mdx",
    "../packages/*/stories/**/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@vueless/storybook-dark-mode"),
    //getAbsolutePath("@kemuridama/storybook-addon-github"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  docs: {},
} as StorybookConfig;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
