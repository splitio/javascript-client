'use strict';
/*eslint no-var: 0*/

var engine = require('@splitsoftware/splitio');
var splitio = global.splitio = {};

splitio.isOn = function alwaysFalse() {
  return false;
};

splitio.start = function splitStartUp(authorizationKey /*: string */, key /*: string */) {
  return engine(authorizationKey, key).then(function(API) {
    splitio.isOn = API.isOn.bind(API, key);

    return splitio;
  });
};
