import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import typescript from "@rollup/plugin-typescript";
const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

//https://2ality.com/2017/02/babel-preset-env.html

const extensions = [".js", ".ts", ".tsx", ".d.ts"];

export default {
  input: "src/index.ts", // our source file
  preserveModules: true,
  output: [
    {
      dir: "lib",
      format: "esm",
      sourcemap: true
    }
  ],
  external: Object.keys(deps),
  plugins: [
    //    resolve({ extensions, module: true }),
    postcss({
      // postfix with .module.css etc. for css modules (DISABLED)
      modules: false,
      extract: "index.css"
    }),
    typescript({})
  ]
};
