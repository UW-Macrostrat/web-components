import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonjs from 'rollup-plugin-commonjs';
import renameExtensions from 'rollup-plugin-rename';

const deps = {...pkg.dependencies, ...pkg.peerDependencies};

//https://2ality.com/2017/02/babel-preset-env.html

const extensions =  [ '.js', '.coffee']

export default {
 input: 'index.coffee', // our source file
  output: [
    // Right now our ES6 and CJS targets are basically the same
    {
      dir: pkg.module,
      format: 'es',
    },
    {
      dir: pkg.main,
      format: 'cjs',
    }
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
    })
  ]
};
