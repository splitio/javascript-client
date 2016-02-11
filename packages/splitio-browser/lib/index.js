'use strict';
/*eslint no-var: 0*/

var engine = require('@splitsoftware/splitio');
var splitio = global.splitio = {};

splitio.isOn = function () {
  return false;
};

splitio.start = function (options) {
  var key = options.cache && options.cache.key;

  if (typeof key !== 'string') {
    return Promise.reject('key parameter should not be empty');
  }

  return engine(options).then(function(API) {
    splitio.isOn = API.isOn.bind(API, key);

    return splitio;
  });
};
