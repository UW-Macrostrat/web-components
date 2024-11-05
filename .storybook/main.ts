import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // vite
  stories: [
    "../packages/**/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-viewport"),
    getAbsolutePath("storybook-dark-mode"),
  ],
  core: {
    builder: {
      name: getAbsolutePath("@storybook/builder-vite"),
      options: {
        viteConfigPath: require.resolve("../vite.config.ts"),
      },
    },
  },
  framework: getAbsolutePath("@storybook/react-vite"),
  docs: {},
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
