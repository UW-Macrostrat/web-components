import pkg from "./package.json"
import babel from "@rollup/plugin-babel"
import postcss from "rollup-plugin-postcss"
import resolve from "@rollup/plugin-node-resolve"

const extensions = [".js", ".ts", ".d.ts"]
const deps = { ...pkg.dependencies, ...pkg.peerDependencies }

export default {
  input: "src/index.ts",
  preserveModules: true,
  output: [
    {
      dir: pkg.main,
      format: "cjs",
      sourcemap: true,
      exports: "auto",
      entryFileNames: "[name].js",
    },
    {
      dir: pkg.module,
      format: "esm",
      sourcemap: true,
      entryFileNames: "[name].js",
    },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: Object.keys(deps),
  watch: {
    include: "src/**",
  },
  plugins: [
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({ extensions, module: true }),
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      modules: true,
      extensions: [".css", ".styl"],
      extract: "index.css",
    }),
    babel({
      extensions,
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
  ],
}
