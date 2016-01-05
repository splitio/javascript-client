'use strict';

var identity = require('./identity');

function matcherAllContext(value) {
  return identity;
};

module.exports = matcherAllContext;
