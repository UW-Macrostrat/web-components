import type { StorybookConfig } from "@storybook/react-vite";

export default {
  // vite
  stories: [
    "../stories/*.mdx",
    "../stories/**/*.stories.@(mdx|js|jsx|ts|tsx)",
    "../packages/*/src/**/*.mdx",
    "../packages/*/stories/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    "storybook-dark-mode",
  ],
  framework: "@storybook/react-vite",
  docs: {},
} as StorybookConfig;
