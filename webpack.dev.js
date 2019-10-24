const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const VERSION = pkg.version;

module.exports = merge(common, {
  mode: 'development',
  output: {
    filename: `[name]-${VERSION}.js`
  }
});
