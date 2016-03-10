const base = require('../request');

module.exports = function POST(params) {
  return base('/metrics/time', Object.assign({
    method: 'POST'
  }, params));
};
