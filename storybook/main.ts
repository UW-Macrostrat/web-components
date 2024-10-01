import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // vite
  stories: [
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    "storybook-dark-mode",
  ],
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: "./vite.config.ts",
      }
    }
  },
  framework:  "@storybook/react-vite",
  docs: {},
};

export default config;
