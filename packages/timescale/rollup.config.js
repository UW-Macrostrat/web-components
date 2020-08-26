import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";

const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
const extensions = [".ts"];
//https://2ality.com/2017/02/babel-preset-env.html

export default {
  input: "src/index.ts", // our source file
  preserveModules: true,
  output: [
    {
      dir: pkg.module,
      format: "esm",
      sourcemap: true,
      entryFileNames: "[name].js",
    },
    {
      dir: pkg.main,
      format: "cjs",
      sourcemap: true,
      entryFileNames: "[name].js",
    },
  ],
  external: Object.keys(deps),
  plugins: [
    commonjs(),
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      autoModules: true,
      extract: "index.css",
    }), // Bundle stylesheets
    resolve({ extensions }),
    babel({
      extensions,
      exclude: "node_modules/**",
    }),
  ],
};
