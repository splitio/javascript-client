'use strict';

var splitChangesService = require('@splitsoftware/splitio-services/lib/splitChanges');
var splitChangesRequest = require('@splitsoftware/splitio-services/lib/splitChanges/get');

var splitMutatorFactory = require('../mutators/splitChanges');

var since = -1;

function splitChangesDataSource() {
  return splitChangesService(splitChangesRequest({
    since: since
  })).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var till = json.till;
    var splits = json.splits;


    since = till;

    return splitMutatorFactory(splits);
  });
}

module.exports = splitChangesDataSource;
//# sourceMappingURL=splitChanges.js.map