import path from "path";

// Load the aliases
import { readFileSync } from "fs";

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../package.json"), "utf8")
);

const { alias } = pkg;
let webComponentsAliases = {};
for (const [k, v] of Object.entries(alias)) {
  webComponentsAliases[k] = path.resolve(__dirname, "../..", v);
}
const cssModuleLoader = {
  loader: "css-loader",
  options: {
    modules: {
      mode: "local",
      localIdentName: "[local]-[hash:base64:6]",
    },
  },
};
const styleLoaders = ["style-loader", cssModuleLoader];

const config = {
  webpackFinal: (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.
    // Make whatever fine-grained changes you need
    config.module.rules = [
      ...config.module.rules,
      {
        test: /\.styl$/,
        use: [...styleLoaders, "stylus-loader"],
        exclude: /node_modules/,
        //include: path.resolve(__dirname, "../../packages"),
      },
      {
        test: /\.(sass|scss)$/,
        use: [...styleLoaders, "sass-loader"],
      },
      // {
      //   test: /\.(sass|scss)$/,
      //   use: [...styleLoaders, "sass-loader"],
      // },
    ];

    config.resolve.alias = {
      ...config.resolve.alias,
      ...webComponentsAliases,
    };

    // Return the altered config
    return config;
  },
  core: {
    builder: "@storybook/builder-webpack5",
  },
  stories: [
    "../../packages/**/*.stories.mdx",
    "../../packages/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    //"storybook-dark-mode",
  ],
  framework: {
    name: "@storybook/react-webpack5",
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
