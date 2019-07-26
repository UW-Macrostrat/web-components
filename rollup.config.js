import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';

export default {
 input: pkg.main, // our source file
 output: [
    {
     file: pkg.module,
     format: 'es' // the preferred format
    }
  ],
  external: Object.keys(pkg.dependencies || {}),
  plugins: [
    stylus(),
    css(),
    resolve({ extensions: [ '.js', '.coffee' ]}),
    coffee(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
