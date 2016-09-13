/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
const webpack = require('webpack');
const pkg = require('./package.json');

const saucelabsConfig = require('karma/sauce');

module.exports = function(config) {
  'use strict';

  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.log('Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.')
    process.exit(1)
  }

  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // load tap integration
    frameworks: [
      'tap'
    ],

    // list of files / patterns to load in the browser
    files: [
      'src/*/__tests__/**/*.spec.js'
    ],

    // list of files / patterns to exclude
    exclude: [
      'src/*/__tests__/**/node.spec.js',
      'src/engine/__tests__/engine/utils.spec.js',
    ],

    // prepare code for the browser using webpack
    preprocessors: {
      'src/*/__tests__/**/*.spec.js': ['webpack']
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

    // Which plugins to enable
    plugins: [
      'karma-*'
    ],

    reporters: ['progress', 'saucelabs'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_DEBUG,

    sauceLabs: {
      testName: `${pkg.name} - ${pkg.version}`,
      recordScreenshots: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
      public: 'public'
    },

    // make IE happy (in theory not required)
    // https://msdn.microsoft.com/en-us/library/ff955275(v=vs.85).aspx
    customHeaders: [{
      match: 'html',
      name: 'X-UA-Compatible',
      value: 'IE=edge'
    }],

    customLaunchers: customLaunchers,

    browsers: Object.keys(customLaunchers),

    singleRun: true,

    // All these values are based on experimentation, SAUCELABs has
    // really big delays on startup, and could fail if we increase
    // concurrency to more than 2.
    concurrency: 2,
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 4*60*1000, //default 10000
    captureTimeout: 4*60*1000 //default 60000
  });
};
