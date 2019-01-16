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
        use: ["style-loader","css-loader", "stylus-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.coffee']
  }
}

