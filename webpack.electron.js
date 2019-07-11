const path = require("path");

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['@babel/preset-env']
  }
};

const coffeeLoader = {
  loader: 'coffee-loader',
  options: {sourceMap: true}
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
  module: {
    rules: [
      {
        test: /\.coffee$/,
        use: [babelLoader, coffeeLoader],
        exclude: /node_modules/
      },
      {
        test: /\.styl$/,
        use: ["style-loader", cssLoader, "stylus-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", cssLoader],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.coffee'],
    alias: {
      app: path.resolve(__dirname, 'app/')
    }
  }
}
