const base = require('../request');

module.exports = function POST(params) {
  return base('/testImpressions', Object.assign({
    method: 'POST'
  }, params));
};
