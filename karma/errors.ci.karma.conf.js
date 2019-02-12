const assign = require('lodash/assign');

module.exports = function(config) {
  'use strict';

  config.set(assign({}, require('./config'), {
    // list of files / patterns to load in the browser
    files: [
      '__tests__/errorCatching/browser.spec.js'
    ],
    // prepare code for the browser using webpack
    preprocessors: {
      '__tests__/errorCatching/browser.spec.js': ['webpack']
    },

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_WARN
  }));
};
