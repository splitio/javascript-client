'use strict';
/*eslint no-var: 0*/

var engine = require('@splitsoftware/splitio');
var splitio = global.splitio = {};

splitio.getTreatment = function (featureName) {
  return 'control';
};

splitio.start = function (options) {
  if (typeof options !== 'object') {
    return Promise.reject('options parameter should not be empty');
  }

  var key = options.core && options.core.key;

  if (typeof key !== 'string') {
    return Promise.reject('key parameter should not be empty');
  }

  return engine(options).then(function(API) {
    splitio.getTreatment = API.getTreatment.bind(API, key);

    return splitio;
  });
};
