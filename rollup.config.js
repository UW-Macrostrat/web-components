import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonJS from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';

const deps = {...pkg.dependencies, ...pkg.peerDependencies};

//https://2ality.com/2017/02/babel-preset-env.html

const extensions =  [ '.js', '.coffee', '.ts']

export default {
  input: 'index.coffee', // our source file
  preserveModules: true,
  output: [
    { dir: pkg.main, format: 'cjs', sourcemap: true, entryFileNames: '[name].js' },
    { dir: pkg.module, format: 'esm', sourcemap: true, entryFileNames: '[name].js' }
  ],
  external: Object.keys(deps),
  plugins: [
    css(),
    resolve({extensions, module: true}),
    stylus(),
    coffee(),
    babel({
      extensions,
      exclude: 'node_modules/**'
    }),
    // Resolve source maps to the original source
    sourceMaps(),
    commonJS()
  ]
};
