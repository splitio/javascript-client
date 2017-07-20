const merge = require('lodash/merge');

module.exports = function(config) {
  'use strict';

  config.set(merge({}, require('./local'), {
    // For now use phantomjs
    browsers: [
      'PhantomJS'
    ],

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO
  }));
};
