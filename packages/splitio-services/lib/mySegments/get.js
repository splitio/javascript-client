'use strict';

var settings = require('@splitsoftware/splitio-utils/lib/settings');
var base = require('../request');

module.exports = function GET() {
  var key = settings.get('key');

  return base('/mySegments/' + key);
};
//# sourceMappingURL=get.js.map