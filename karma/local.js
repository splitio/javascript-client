'use strict';

const merge = require('lodash/merge');

module.exports = merge({}, require('./config'), {
  browsers: [
    'Chrome'
  ],

  coverageReporter: {
    type : 'html',
    dir : 'coverage/'
  },

  reporters: [
    'coverage'
  ]
});
