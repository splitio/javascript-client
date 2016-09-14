const webpack = require('webpack');
const pkg = require('./package.json');

const VERSION = pkg.version;
const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    splitio: './src/core'
  },

  output: {
    filename: IS_PROD ? `[name]-${VERSION}.min.js` : `[name]-${VERSION}.js`,
    path: __dirname + '/umd',
    library: 'splitio',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ]
  },

  node: {
    Buffer: false
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};
