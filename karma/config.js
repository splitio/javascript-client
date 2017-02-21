'use strict';

const webpack = require('webpack');

module.exports = {
  // base path, that will be used to resolve files and exclude
  basePath: '',

  // load tap integration
  frameworks: [
    'tap'
  ],

  // list of files / patterns to load in the browser
  files: [
    '../src/*/__tests__/**/*.spec.js'
  ],

  // list of files / patterns to exclude
  exclude: [
    '../src/*/__tests__/**/node.spec.js'
  ],

  // prepare code for the browser using webpack
  preprocessors: {
    '../src/*/__tests__/**/*.spec.js': ['webpack']
  },

  webpack: {
    // devtool: 'cheap-module-inline-source-map',
    module: {
      loaders: [
        { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
        { test: /\.json$/, exclude: /node_modules/, loader: 'json' }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('test'),
        __DEV__: true
      })
    ],
    node: {
      fs: 'empty'
    }
  },

  webpackServer: {
    noInfo: true
  },

  // web server port
  port: 9876,

  // make IE happy (in theory not required)
  // https://msdn.microsoft.com/en-us/library/ff955275(v=vs.85).aspx
  customHeaders: [{
    match: 'html',
    name: 'X-UA-Compatible',
    value: 'IE=edge'
  }],

  // Enable debugging in PhantomJS
  customLaunchers: {
    'PhantomJS_custom': {
      base: 'PhantomJS',
      debug: true
    }
  },

  // Which plugins to enable
  plugins: [
    'karma-*'
  ],

  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  singleRun: true,

  colors: true
};
