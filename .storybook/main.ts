import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/react-vite";

// Resolve geologic patterns from the package
// If we're using PnP mode, we have to have an "unplugged" version of the package
// to allow node_modules to be resolved.
const geologicPatterns = dirname(require.resolve("geologic-patterns"));

export default {
  // vite
  stories: [
    "../packages/*/src/**/*.mdx",
    "../packages/*/stories/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  staticDirs: [
    {
      from: join(geologicPatterns, "assets/svg"),
      to: "/patterns",
    },
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    "storybook-dark-mode",
  ],
  core: {
    builder: "@storybook/builder-vite",
  },
  framework: "@storybook/react-vite",
  docs: {},
  async viteFinal(config) {
    console.log(config);
    return config;
  },
} as StorybookConfig;
