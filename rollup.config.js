import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonjs from 'rollup-plugin-commonjs';
import renameExtensions from '@betit/rollup-plugin-rename-extensions';

export default {
 input: pkg.main, // our source file
 output: {
     dir: 'lib/esm',
     format: 'es', // the preferred format
  },
  external: Object.keys(pkg.dependencies || {}),
  preserveModules: true,
  plugins: [
    coffee(),
    resolve({ extensions: [ '.js', '.coffee' ]}),
    stylus(),
    css(),
    babel({
      exclude: 'node_modules/**'
    }),
    renameExtensions({
      include: ['**/*.coffee'],
      mappings: {".coffee": ".js"}
    }),
  ]
};
