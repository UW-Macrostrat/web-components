const path = require("path");

const packageSrc = name =>
  path.resolve(__dirname, "..", "packages", name, "src");

module.exports = {
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.styl$/,
      use: [
        {
          loader: "style-loader"
        },
        {
          loader: "css-loader"
        },
        {
          loader: "stylus-loader",
          options: { stylusOptions: {} }
        }
      ],
      include: path.resolve(__dirname, "../packages")
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "@macrostrat/column-components": packageSrc("column-components"),
      "@macrostrat/ui-components": packageSrc("ui-components"),
      "@macrostrat/data-components": packageSrc("data-components")
    };

    console.log(config);

    // Return the altered config
    return config;
  },
  stories: [
    "../packages/**/*.stories.mdx",
    "../packages/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-viewport",
    "@storybook/preset-scss",
    "storybook-dark-mode"
  ]
};
