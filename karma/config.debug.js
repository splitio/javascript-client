'use strict';

const merge = require('lodash/merge');

module.exports = merge({}, require('./config'), {
  customLaunchers: {
    ChromeNoSandbox: {
      base: 'Chrome',
      flags: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
  },
  browsers: [
    'ChromeNoSandbox'
  ],
  webpack: {
    mode: 'development'
  },
  singleRun: false
});
