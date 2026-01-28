// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

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
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@vueless/storybook-dark-mode"),
  ],
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    // Prioritize source files for bundling if available
    return mergeConfig(config, {
      resolve: {
        conditions: ["source"],
        dedupe: [
          "react",
          "react-dom",
          "@macrostrat/ui-components",
          "@macrostrat/column-components",
          "@macrostrat/mapbox-react",
          "@macrostrat/map-interface",
          "@macrostrat/column-views",
        ],
      },
      optimizeDeps: {
        exclude: ["node_modules/.cache/storybook"],
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
  },
  docs: {},
} as StorybookConfig;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(value));
}
