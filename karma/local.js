'use strict';

const merge = require('lodash/merge');

module.exports = merge({}, require('./config'), {
  browsers: [
    'Chrome'
  ]
});
