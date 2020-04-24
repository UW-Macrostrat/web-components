import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'

const pkg = require('./package.json')

const extensions = ['.js', '.ts']
const deps = {...pkg.dependencies, ...pkg.peerDependencies};

export default {
  input: 'src',
  preserveModules: true,
  output: [
    { dir: pkg.main, format: 'cjs', sourcemap: true, entryFileNames: '[name].js' },
    { dir: pkg.module, format: 'esm', sourcemap: true, entryFileNames: '[name].js' },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: Object.keys(deps),
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Allow json resolution
    json(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({extensions}),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Bundle stylesheets
    postcss({
      // postfix with .module.css etc. for css modules
      modules: true,
      extensions: ['.css', '.styl'],
      extract: "index.css"
    }),
    babel({
      extensions,
      exclude: 'node_modules/**'
    })
  ],
}
