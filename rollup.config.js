import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import coffee from 'rollup-plugin-coffee-script';
import resolve from 'rollup-plugin-node-resolve';
import stylus from 'rollup-plugin-stylus-compiler';
import css from 'rollup-plugin-css-porter';
import commonjs from 'rollup-plugin-commonjs';

const externalModules = (Object.keys(pkg.dependencies || {})
                       + Object.keys(pkg.peerDependencies || {}));

export default {
 input: pkg.main, // our source file
 output: [
    {
     file: pkg.module,
     format: 'es' // the preferred format
    }
  ],
  external: externalModules,
  plugins: [
    stylus(),
    css(),
    /*
    CommonJS module and namedExports fixes errors with React
    https://rollupjs.org/guide/en/#error-name-is-not-exported-by-module.
    Apparently, React isn't an es6 module. Who knew?
    */
    commonjs({
      namedExports: {
         'react': ['Component', 'createContext', 'Children', 'createElement', 'Fragment'],
         'react-dom': ['findDOMNode'],
         'react-is': ['isValidElementType']
      }
    }),
    resolve({ extensions: [ '.js', '.coffee' ]}),
    coffee(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
