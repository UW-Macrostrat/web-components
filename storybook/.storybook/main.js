import { dirname, join } from "path";

const config = {
  // vite
  stories: [
    "../../packages/**/*.stories.mdx",
    "../../packages/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-viewport"),
    getAbsolutePath("storybook-dark-mode"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: true,
  },
  babel: (config) => {
    return { ...config, rootMode: "upward" };
  },
};

export default config;

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
