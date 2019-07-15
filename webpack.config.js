const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const {IgnorePlugin, DefinePlugin} = require('webpack');
const webRoot = path.resolve('../Products/webroot');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const mode = 'development';


const browserSync = new BrowserSyncPlugin({
  port: 3000,
  host: 'localhost',
  server: { baseDir: [ webRoot ] }
});

const define = new DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(mode)
});

const uglify = new UglifyJsPlugin();

const plugins = [browserSync, define];//, uglify]
const ignores = [/^pg-promise/,/^electron/,/^pg/,/^fs/];


for (let i of Array.from(ignores)) {
  plugins.push(new IgnorePlugin(i));
}


const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['es2015','react'],
    sourceMap: mode === 'development'
  }
};

const exclude = /node_modules/;

const coffeeLoader = {
  loader: 'coffee-loader',
  options: {sourceMap: mode === 'development'}
};

const cssLoader = {
  loader: 'css-loader',
  options: {
    modules: {
      mode: 'global',
      localIdentName: '[name]__[local]___[hash:base64:5]'
    }
  }
};

module.exports = {
  mode,
  module: {
    rules: [
      {test: /\.coffee$/, use: [babelLoader, coffeeLoader], exclude},
      {test: /\.(js|jsx)$/, use: [babelLoader], exclude},
      {test: /\.styl$/, use: ["style-loader",cssLoader, "stylus-loader"]},
      {test: /\.css$/, use: ["style-loader", cssLoader]},
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      },
      {
        test: /\.(png|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              useRelativePath: true,
              outputPath: 'sections/assets/',
              name: '[name].[ext]'
            }
          }
        ]
      }

    ]
  },
  resolve: {
    extensions: [".coffee", ".js"],
    alias: {
      app$: path.resolve(__dirname, 'app')
    }
  },
  entry: {
    'sections/assets/index': "./app/entrypoints/sections-index.coffee",
    'map/assets/index': "./app/entrypoints/map-index.coffee"
  },
  output: {
    path: webRoot,
    filename: "[name].js"
  },
  plugins
};
