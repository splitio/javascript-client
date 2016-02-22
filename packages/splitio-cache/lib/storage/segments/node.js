/* @flow */'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = require('debug')('splitio-cache:segments');

var _segments = new _map2.default();

module.exports = {
  update: function update(name /*: string */, segments /*: Set */) /*: void */{
    log('Updating segment ' + name + ' with [' + [].concat((0, _toConsumableArray3.default)(segments)) + ']');

    _segments.set(name, segments);
  },
  get: function get(name /*: string */) /*: Set */{
    return _segments.get(name) || new _set2.default();
  },
  toJSON: function toJSON() {
    return _segments;
  }
};
//# sourceMappingURL=node.js.map