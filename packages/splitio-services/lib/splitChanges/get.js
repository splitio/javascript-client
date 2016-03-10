'use strict';

var base = require('../request');

module.exports = function GET(_ref) {
  var since = _ref.since;

  return base('/splitChanges?since=' + since);
};
//# sourceMappingURL=get.js.map