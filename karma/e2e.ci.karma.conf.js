const assign = require('lodash/assign');

module.exports = function (config) {
  'use strict';

  config.set(assign({}, require('./config'), {
    // list of files / patterns to load in the browser
    files: [
      { pattern: '__tests__/browser.spec.js', watched: false }
    ],
    // prepare code for the browser using rollup
    preprocessors: {
      '__tests__/browser.spec.js': ['rollup']
    },

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_WARN
  }));
};
