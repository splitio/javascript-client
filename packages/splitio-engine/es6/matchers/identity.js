const log = require('debug')('splitio-engine:matcher');

function identityMatcher() /*: boolean */ {
  log('[identityMatcher] always true');

  return true;
}

module.exports = identityMatcher;
