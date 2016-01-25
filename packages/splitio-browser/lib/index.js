'use strict';

var engine = require('@splitsoftware/splitio');

var splitio = global.splitio = {};

splitio.start = function splitStartUp(authorizationKey /*: string */, userId /*: string */) {
  return engine(authorizationKey, userId).then(function (API) {
    splitio.isOn = API.isOn;

    return API;
  });
};

splitio.isOn = function alwaysFalse() {
  return false;
};
