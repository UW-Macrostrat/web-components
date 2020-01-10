import resolve from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import coffee from 'rollup-plugin-coffee-script'
import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import localResolve from 'rollup-plugin-local-resolve';
import path from 'path'

const pkg = require('./package.json')

const extensions = ['.js','.coffee', '.ts']
const deps = {...pkg.dependencies, ...pkg.peerDependencies};
const moduleDir = "dist/esm";

export default {
  input: 'src',
  preserveModules: true,
  output: [
    //{ file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    { dir: moduleDir, format: 'esm', sourcemap: true, entryFileNames: '[name].js' },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [
    ...Object.keys(deps),
    'immutability-helper',
    'react-scroll',
    'd3-axis'
  ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile coffeescript files
    coffee(),
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      modules: true,
      extract: "dist/column-components.css"
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({extensions, module:true}),
    localResolve(),
    babel({
      extensions,
      exclude: 'node_modules/**'
    }),
    // Resolve source maps to the original source
    sourceMaps(),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
  ],
}
