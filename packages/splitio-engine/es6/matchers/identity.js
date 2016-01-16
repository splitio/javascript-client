'use strict';

var log = require('debug')('splitio-engine:matcher');

module.exports = function identityMatcher() {
  log('[identityMatcher] always true');

  return true;
};
