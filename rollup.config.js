import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonjs from 'rollup-plugin-commonjs';
import renameExtensions from 'rollup-plugin-rename';

const deps = {...pkg.dependencies, ...pkg.peerDependencies};

export default {
 input: pkg.main, // our source file
 output: {
     dir: 'lib/esm',
     format: 'es', // the preferred format
  },
  external: Object.keys(deps),
  plugins: [
    resolve({ extensions: [ '.js', '.coffee' ]}),
    stylus(),
    css(),
    coffee(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
