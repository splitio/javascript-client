const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // HACK because the build requires this configuration but it's not used.
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
