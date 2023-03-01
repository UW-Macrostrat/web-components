const path = require("path");
const { alias } = require("../../package.json");

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

module.exports = {
  webpackFinal: async (config, { configType }) => {
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
        include: path.resolve(__dirname, "../../packages"),
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
  stories: [
    "../../packages/**/*.stories.mdx",
    "../../packages/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    "@storybook/preset-scss",
    "storybook-dark-mode",
  ],
};
