import pkg from "./package.json";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";
import path from "path";
const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

//https://2ality.com/2017/02/babel-preset-env.html

const extensions = [".js", ".ts", ".d.ts"];

export default {
  input: "src/index.ts", // our source file
  preserveModules: true,
  output: [
    {
      dir: pkg.module,
      format: "esm",
      sourcemap: true,
      entryFileNames: "[name].js"
    },
    {
      dir: pkg.main,
      format: "cjs",
      sourcemap: true,
      entryFileNames: "[name].js"
    }
  ],
  external: Object.keys(deps),
  plugins: [
    resolve({ extensions, module: true }),
    postcss({
      // postfix with .module.css etc. for css modules (DISABLED)
      modules: false,
      // CSS cannot be extracted outside of the bundle directory for rollup v2.
      extract: "index.css"
    }),
    babel({
      extensions,
      exclude: "node_modules/**",
      babelHelpers: "bundled"
    })
  ]
};
