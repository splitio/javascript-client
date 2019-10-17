const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const VERSION = pkg.version;

module.exports = env => merge(common, {
  mode: 'production',
  output: {
    filename: `[name]-${VERSION}${env.branch === 'deps_update_1' ? ('-' + env.commit_hash) : ''}.min.js`
  }
});
