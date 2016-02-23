'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var base = require('../request');

module.exports = function POST(params) {
  return base('/testImpressions', (0, _assign2.default)({
    method: 'POST'
  }, params));
};
//# sourceMappingURL=post.js.map