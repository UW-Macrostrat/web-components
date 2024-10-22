export default {
  resolve: {
    conditions: ["typescript"],
  },
  // https://vite.dev/config/shared-options.html#css-preprocessoroptions
  scss: {
    api: "modern-compiler", // or "modern", "legacy"
  },
};
