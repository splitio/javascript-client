'use strict';
// Comment the next two lines if you want to run with Chrome instead of Chromium
const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();

const webpack = require('webpack');

module.exports = {
  // base path, that will be used to resolve files and exclude
  basePath: '../src',

  // load tap integration
  frameworks: [
    'tap'
  ],

  // Run on Chrome Headless
  browsers: [
    'ChromeHeadless'
  ],

  // list of files / patterns to load in the browser
  files: [
    '*/**/__tests__/**/*.spec.js',
    {
      pattern: 'engine/__tests__/engine/mocks/murmur3*.csv',
      watched: false,
      included: false,
      served: true,
      nocache: true
    },
    {
      pattern: 'engine/__tests__/matchers/mocks/regex.txt',
      watched: false,
      included: false,
      served: true,
      nocache: true
    }
  ],

  // list of files / patterns to exclude
  exclude: [
    '*/**/__tests__/**/node.spec.js',
    '*/**/__tests__/**/node_redis.spec.js',
    '*/**/__tests__/**/inputValidation/*.spec.js'
  ],

  // prepare code for the browser using webpack
  preprocessors: {
    '*/**/__tests__/**/*.spec.js': ['webpack'],
  },

  webpack: {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', {
                'useBuiltIns': false, // default value: don't add core-js or babel polyfills
                'targets': {
                  'ie': '10',
                  'node': '6'
                }
              }]],
              plugins: [['@babel/plugin-transform-runtime', {
                // default values
                'absoluteRuntime': false,
                'corejs': false,
                'regenerator': true,
                'useESModules': false,
                'helpers': true
              }]]
            }
          }
        }
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
  }, {
    match: 'csv$',
    name: 'Content-Type',
    value: 'text/plain'
  }],

  // Which plugins to enable
  plugins: [
    'karma-*'
  ],

  browserConsoleLogOptions: {
    terminal: false
  },

  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  singleRun: true,

  colors: true,

  /**
   * @WARNING in local mode, murmur verification takes forever (chrome tested),
   *          so I keep this only to be used by Chrome Headless.
   */
  browserDisconnectTolerance: 1,
  browserNoActivityTimeout: 60 * 60 * 1000,
  reportSlowerThan: 30,
};
