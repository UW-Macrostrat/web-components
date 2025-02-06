import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/react-vite";

// Resolve geologic patterns from the package
// If we're using PnP mode, we have to have an "unplugged" version of the package
// to allow node_modules to be resolved.
const geologicPatterns = dirname(require.resolve("geologic-patterns"));

const config: StorybookConfig = {
  // vite
  stories: [
    "../packages/**/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],
  staticDirs: [
    {
      from: join(geologicPatterns, "assets/svg"),
      to: "/patterns",
    },
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-viewport"),
    getAbsolutePath("storybook-dark-mode"),
  ],
  core: {
    builder: "@storybook/builder-vite",
  },
  framework: getAbsolutePath("@storybook/react-vite"),
  docs: {},
  async viteFinal(config) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import("vite");

    return mergeConfig(config, {
      // Add dependencies to pre-optimization
      optimizeDeps: {
        include: ["storybook-dark-mode"],
      },
      // Resolve dependencies with the "typescript" entry point
      resolve: {
        conditions: ["typescript"],
      },
    });
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
