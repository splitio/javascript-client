'use strict';

var settings = require('@splitsoftware/splitio-utils/lib/settings');
var base = require('../request');

module.exports = function GET(_ref) {
  var since = _ref.since;

  return base('/splitChanges?since=' + since);
};
//# sourceMappingURL=get.js.map