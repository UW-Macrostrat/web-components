const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "src/main.sass"),
      name: "@macrostrat/style-system",
      fileName: (format) => `style-system.${format}.js`,
    },
  },
});
