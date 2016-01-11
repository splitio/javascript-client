'use strict';

require('native-promise-only');

var ds = require('../ds');
var cache = new Map();

module.exports = {

  get(dataSourceKey) {
    if (cache.has(dataSourceKey)) {
      return Promise.resolve(cache.get(dataSourceKey));
    } else {
      return Promise.reject(new Error(`Missing entry. Please retry later.`));
    }
  },

  update(dataSourceKey, paramsProvider) {
    return ds.factory({dataSourceKey, ...paramsProvider})
      .request()
        .then(dto => {
          cache.set(dataSourceKey, dto);
          return dto;
        });
  }
};
