import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import commonjs from '@rollup/plugin-commonjs'

import pkg from './package.json'

const extensions = ['.js', '.ts']
const deps = { ...pkg.dependencies, ...pkg.peerDependencies }
const external = [...Object.keys(deps), '@macrostrat/ui-components/lib/esm/util/stateful']

const outputParams = {
  preserveModules: true,
  preserveModulesRoot: 'src',
  sourcemap: true,
  entryFileNames: '[name].js',
  exports: 'auto',
}

export default {
  input: 'src/index.ts',
  output: [
    { dir: pkg.main, format: 'cjs', ...outputParams },
    {
      dir: pkg.module,
      format: 'esm',
      ...outputParams,
    },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external,
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      autoModules: true,
      extract: 'index.css',
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      exclude: 'node_modules/**',
    }),
  ],
}
