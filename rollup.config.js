import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import postcss from 'rollup-plugin-postcss';
import renameExtensions from '@betit/rollup-plugin-rename-extensions';

const deps = {...pkg.dependencies, ...pkg.peerDependencies};

//https://2ality.com/2017/02/babel-preset-env.html

const extensions =  [ '.js', '.ts']

export default {
  input: 'src/index.ts', // our source file
  preserveModules: true,
  output: [
    { dir: pkg.main, format: 'cjs', sourcemap: true, entryFileNames: '[name].js' },
    { dir: pkg.module, format: 'esm', sourcemap: true, entryFileNames: '[name].js' }
  ],
  external: Object.keys(deps),
  plugins: [
    resolve({extensions, module: true}),
    postcss({
      // postfix with .module.css etc. for css modules (DISABLED)
      modules: false,
      extract: "lib/index.css"
    }),
    babel({
      extensions,
      exclude: 'node_modules/**'
    }),
    renameExtensions({
      include: ['**/*.ts'],
      mappings: {'.ts': '.js'},
    }),
    // Resolve source maps to the original source
    sourceMaps()
  ]
};
