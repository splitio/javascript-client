"use strict";

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _hasInstance = require("babel-runtime/core-js/symbol/has-instance");

var _hasInstance2 = _interopRequireDefault(_hasInstance);

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MySegmentsDTO = function () {
  function MySegmentsDTO(input) {
    return Array.isArray(input) && input.every(function (item) {
      return typeof item === 'string';
    });
  }

  ;
  (0, _defineProperty2.default)(MySegmentsDTO, _hasInstance2.default, {
    value: function value(input) {
      return MySegmentsDTO(input);
    }
  });
  return MySegmentsDTO;
}();

function MySegmentMutationsFactory(mySegments) {
  function _ref(_id) {
    if (!(typeof _id === 'function')) {
      throw new TypeError("Function \"MySegmentMutationsFactory\" return value violates contract.\n\nExpected:\nFunction\n\nGot:\n" + _inspect(_id));
    }

    return _id;
  }

  if (!MySegmentsDTO(mySegments)) {
    throw new TypeError("Value of argument \"mySegments\" violates contract.\n\nExpected:\nArray<string>\n\nGot:\n" + _inspect(mySegments));
  }

  function segmentMutations(storageMutator) {
    if (!(typeof storageMutator === 'function')) {
      throw new TypeError("Value of argument \"storageMutator\" violates contract.\n\nExpected:\nFunction\n\nGot:\n" + _inspect(storageMutator));
    }

    storageMutator(new _set2.default(mySegments));
  }

  return _ref(segmentMutations);
}

module.exports = MySegmentMutationsFactory;

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
    return typeof input === "undefined" ? "undefined" : (0, _typeof3.default)(input);
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

      if ((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
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
//# sourceMappingURL=mySegments.js.map