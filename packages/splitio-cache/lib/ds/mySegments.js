'use strict';

var mySegmentsService = require('@splitsoftware/splitio-services/lib/mySegments');
var mySegmentsRequest = require('@splitsoftware/splitio-services/lib/mySegments/get');

var mySegmentMutationsFactory = require('../mutators/mySegments');

function mySegmentsDataSource() /*: Promise */{
  return mySegmentsService(mySegmentsRequest()).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    return mySegmentMutationsFactory(json.mySegments.map(function (segment) {
      return segment.name;
    }));
  }).catch(function () {/* noop */});
}

module.exports = mySegmentsDataSource;
//# sourceMappingURL=mySegments.js.map