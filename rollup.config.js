import pkg from "./package.json";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

//https://2ality.com/2017/02/babel-preset-env.html

export default {
  input: "src/index.ts", // our source file
  preserveModules: true,
  output: [
    {
      dir: "lib/esm",
      format: "esm",
      sourcemap: true
    },
    {
      dir: "lib/cjs",
      format: "cjs",
      sourcemap: true
    }
  ],
  external: Object.keys(deps),
  plugins: [
    resolve({ module: true }),
    postcss({
      // postfix with .module.css etc. for css modules (DISABLED)
      modules: false,
      extract: "index.css"
    }),
    typescript({ useTsconfigDeclarationDir: true })
  ]
};
