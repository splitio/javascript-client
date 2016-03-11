'use strict';

var base = require('../request');

module.exports = function GET(_ref) {
  var since = _ref.since;
  var segmentName = _ref.segmentName;

  return base('/segmentChanges/' + segmentName + '?since=' + since);
};
//# sourceMappingURL=get.js.map