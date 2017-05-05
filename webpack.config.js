const webpack = require('webpack');
const pkg = require('./package.json');

const VERSION = pkg.version;
const IS_PROD = process.env.NODE_ENV === 'production';

const IS_CI = process.env.CI === 'true';
const CI_COMMIT_ID = IS_CI ? process.env.CI_COMMIT_ID : '';
const CI_BRANCH = process.env.CI_BRANCH;

const IS_MASTER_BRANCH = IS_CI && CI_BRANCH === 'master';

function filename() {
  if (IS_CI && !IS_MASTER_BRANCH) {
    return IS_PROD ? `[name]-dev-${CI_COMMIT_ID}.min.js` : `[name]-dev-${CI_COMMIT_ID}.js`;
  } else {
    return IS_PROD ? `[name]-${VERSION}.min.js` : `[name]-${VERSION}.js`;
  }
}

module.exports = {
  entry: {
    split: ['./src']
  },

  output: {
    filename: filename(),
    path: __dirname + '/umd',
    library: 'splitio',
    libraryTarget: 'umd'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!logplease).*/,
        loader: 'babel-loader'
      }
    ]
  },

  node: {
    fs: 'empty',
    module: 'empty'
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};
