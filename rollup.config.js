import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonjs from 'rollup-plugin-commonjs';
import renameExtensions from 'rollup-plugin-rename';

export default {
 input: pkg.main, // our source file
 output: {
     dir: 'lib/esm',
     format: 'es', // the preferred format
  },
  external: Object.keys(pkg.dependencies || {}),
  experimentalOptimizeChunks: true,
  experimentalDynamicImport: true,
  plugins: [
    resolve({ extensions: [ '.js', '.coffee' ]}),
    stylus(),
    css(),
    /*
    CommonJS module and namedExports fixes errors with React
    https://rollupjs.org/guide/en/#error-name-is-not-exported-by-module.
    Apparently, React isn't an es6 module. Who knew?
    */
    coffee(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
