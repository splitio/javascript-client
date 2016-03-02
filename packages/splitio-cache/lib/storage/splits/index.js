'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _iterator2 = require('babel-runtime/core-js/symbol/iterator');

var _iterator3 = _interopRequireDefault(_iterator2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Split = require('@splitsoftware/splitio-engine');

function SplitsStorage() {
  this.storage = new _map2.default();
}

SplitsStorage.prototype.update = function (updates) {
  var _this = this;

  if (!(Array.isArray(updates) && updates.every(function (item) {
    return item instanceof Split;
  }))) {
    throw new TypeError('Value of argument "updates" violates contract.\n\nExpected:\nArray<Split>\n\nGot:\n' + _inspect(updates));
  }

  updates.forEach(function (split) {
    if (!split.isGarbage()) {
      _this.storage.set(split.getKey(), split);
    } else {
      _this.storage.delete(split.getKey());
    }
  });
};

SplitsStorage.prototype.get = function (splitName) {
  function _ref2(_id2) {
    if (!(_id2 == null || _id2 instanceof Split)) {
      throw new TypeError('Function return value violates contract.\n\nExpected:\n?Split\n\nGot:\n' + _inspect(_id2));
    }

    return _id2;
  }

  if (!(typeof splitName === 'string')) {
    throw new TypeError('Value of argument "splitName" violates contract.\n\nExpected:\nstring\n\nGot:\n' + _inspect(splitName));
  }

  return _ref2(this.storage.get(splitName));
};

// @TODO optimize this query to be cached after each update
SplitsStorage.prototype.getSegments = function () {
  function _ref3(_id3) {
    if (!(_id3 instanceof _set2.default)) {
      throw new TypeError('Function return value violates contract.\n\nExpected:\nSet\n\nGot:\n' + _inspect(_id3));
    }

    return _id3;
  }

  var mergedSegmentNames = new _set2.default();

  _storage$values = this.storage.values();

  if (!(_storage$values && (typeof _storage$values[_iterator3.default] === 'function' || Array.isArray(_storage$values)))) {
    throw new TypeError('Expected _storage$values to be iterable, got ' + _inspect(_storage$values));
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(_storage$values), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _storage$values;

      var split = _step.value;

      mergedSegmentNames = new _set2.default([].concat((0, _toConsumableArray3.default)(mergedSegmentNames), (0, _toConsumableArray3.default)(split.getSegments())));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return _ref3(mergedSegmentNames);
};

SplitsStorage.prototype.toJSON = function () {
  function _ref4(_id4) {
    if (!(_id4 instanceof _map2.default)) {
      throw new TypeError('Function return value violates contract.\n\nExpected:\nMap\n\nGot:\n' + _inspect(_id4));
    }

    return _id4;
  }

  return _ref4(this.storage);
};

module.exports = SplitsStorage;

function _inspect(input, depth) {
  var maxDepth = 4;
  var maxKeys = 15;

  if (depth === undefined) {
    depth = 0;
  }

  depth += 1;

  if (input === null) {
    return 'null';
  } else if (input === undefined) {
    return 'void';
  } else if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return typeof input === 'undefined' ? 'undefined' : (0, _typeof3.default)(input);
  } else if (Array.isArray(input)) {
    if (input.length > 0) {
      var _ret = function () {
        if (depth > maxDepth) return {
            v: '[...]'
          };

        var first = _inspect(input[0], depth);

        if (input.every(function (item) {
          return _inspect(item, depth) === first;
        })) {
          return {
            v: first.trim() + '[]'
          };
        } else {
          return {
            v: '[' + input.slice(0, maxKeys).map(function (item) {
              return _inspect(item, depth);
            }).join(', ') + (input.length >= maxKeys ? ', ...' : '') + ']'
          };
        }
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
    } else {
      return 'Array';
    }
  } else {
    var keys = (0, _keys2.default)(input);

    if (!keys.length) {
      if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
        return input.constructor.name;
      } else {
        return 'Object';
      }
    }

    if (depth > maxDepth) return '{...}';
    var indent = '  '.repeat(depth - 1);
    var entries = keys.slice(0, maxKeys).map(function (key) {
      return (/^([A-Z_$][A-Z0-9_$]*)$/i.test(key) ? key : (0, _stringify2.default)(key)) + ': ' + _inspect(input[key], depth) + ';';
    }).join('\n  ' + indent);

    if (keys.length >= maxKeys) {
      entries += '\n  ' + indent + '...';
    }

    if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
      return input.constructor.name + ' {\n  ' + indent + entries + '\n' + indent + '}';
    } else {
      return '{\n  ' + indent + entries + '\n' + indent + '}';
    }
  }
}
//# sourceMappingURL=index.js.map