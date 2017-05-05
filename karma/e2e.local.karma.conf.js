const assign = require('lodash/assign');

module.exports = function(config) {
  'use strict';

  config.set(assign({}, require('./local'), {
    // list of files / patterns to load in the browser
    files: [
      // Test using the CDN version of the SDK
      // 'https://cdn.split.io/sdk/split-9.1.0.min.js',
      '../src/__tests__/**/browser.spec.js'
      // '../src/__tests__/shared-instantiation/browser.spec.js'
      // '../src/storage/__tests__/**/*.spec.js'
    ],

    // prepare code for the browser using webpack
    preprocessors: {
      '../src/__tests__/**/browser.spec.js': ['webpack']
      // '../src/__tests__/shared-instantiation/browser.spec.js': ['webpack']
      // '../src/storage/__tests__/**/*.spec.js': ['webpack']
    },

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_DEBUG
  }));
};
