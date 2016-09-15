// const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  output: {
    filename: 'asd'
  },

  node: {
    Buffer: false
  },

  plugins: [
    new CopyWebpackPlugin([{
      context: 'src/',
      from: '**/package.json',
      to: 'lib/'
    }])
  ]
};
