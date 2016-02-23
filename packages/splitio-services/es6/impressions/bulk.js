'use strict';

const base = require('../request');

module.exports = function BULK(params) {
  return base('/testImpressions/bulk', Object.assign({
    method: 'POST'
  }, params));
};
