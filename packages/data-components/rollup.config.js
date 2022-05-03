import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ modulesOnly: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss({
        extract: false,
        modules: true,
        use: ["sass"]
      })
    ]
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.scss$/]
  }
];
