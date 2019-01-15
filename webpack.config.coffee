path = require 'path'
BrowserSyncPlugin = require 'browser-sync-webpack-plugin'
{IgnorePlugin, DefinePlugin} = require 'webpack'
webRoot = path.resolve '../Products/webroot'
UglifyJsPlugin = require('uglifyjs-webpack-plugin')

mode = 'development'


browserSync = new BrowserSyncPlugin {
  port: 3000
  host: 'localhost'
  server: { baseDir: [ webRoot ] }
}

define = new DefinePlugin {
  'process.env.NODE_ENV': JSON.stringify(mode)
}

uglify = new UglifyJsPlugin()

plugins = [browserSync, define]#, uglify]
ignores = [/^pg-promise/,/^electron/,/^pg/,/^fs/]


for i in ignores
  plugins.push new IgnorePlugin(i)


babelLoader = {
  loader: 'babel-loader'
  options: {
    presets: ['es2015','react']
    sourceMap: mode == 'development'
  }
}

exclude = /node_modules/

coffeeLoader = {
  loader: 'coffee-loader'
  options: {sourceMap: mode == 'development'}
}

module.exports = {
  mode
  module:
    rules: [
      {test: /\.coffee$/, use: [babelLoader, coffeeLoader], exclude}
      {test: /\.(js|jsx)$/, use: [babelLoader], exclude}
      {test: /\.styl$/, use: ["style-loader","css-loader", "stylus-loader"]}
      {test: /\.css$/, use: ["style-loader", "css-loader"]}
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
      {
        test: /\.(png|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              useRelativePath: true
              outputPath: 'sections/assets/'
              name: '[name].[ext]'
            }
          }
        ]
      }

    ]
  resolve:
    extensions: [".coffee", ".js"]
  entry: {
    'sections/assets/index': "./app/entrypoints/sections-index.coffee"
    'map/assets/index': "./app/entrypoints/map-index.coffee"
  }
  output:
    path: webRoot
    filename: "[name].js"
  plugins
}
