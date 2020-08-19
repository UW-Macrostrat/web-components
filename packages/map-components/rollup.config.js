import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'

import pkg from './package.json'

const extensions = ['.js', '.ts']
const deps = { ...pkg.dependencies, ...pkg.peerDependencies }

export default {
  input: 'src/index.ts',
  preserveModules: true,
  output: [
    { dir: pkg.main, format: 'cjs', sourcemap: true, entryFileNames: '[name].js' },
    { dir: pkg.module, format: 'esm', sourcemap: true, entryFileNames: '[name].js' }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: Object.keys(deps),
  watch: {
    include: 'src/**'
  },
  plugins: [
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      autoModules: true,
      extract: 'index.css'
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({ extensions }),
    babel({
      extensions,
      exclude: 'node_modules/**'
    })
  ]
}
