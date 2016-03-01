"use strict";

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _hasInstance = require("babel-runtime/core-js/symbol/has-instance");

var _hasInstance2 = _interopRequireDefault(_hasInstance);

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SegmentChangesDTO = function () {
  function SegmentChangesDTO(input) {
    return input != null && typeof input.name === 'string' && Array.isArray(input.added) && input.added.every(function (item) {
      return typeof item === 'string';
    }) && Array.isArray(input.removed) && input.removed.every(function (item) {
      return typeof item === 'string';
    });
  }

  ;
  (0, _defineProperty2.default)(SegmentChangesDTO, _hasInstance2.default, {
    value: function value(input) {
      return SegmentChangesDTO(input);
    }
  });
  return SegmentChangesDTO;
}();

function SegmentMutationsFactory(_ref3) {
  var name = _ref3.name;
  var added = _ref3.added;
  var removed = _ref3.removed;

  function _ref(_id) {
    if (!(typeof _id === 'function')) {
      throw new TypeError("Function \"SegmentMutationsFactory\" return value violates contract.\n\nExpected:\nFunction\n\nGot:\n" + _inspect(_id));
    }

    return _id;
  }

  if (!SegmentChangesDTO(arguments[0])) {
    throw new TypeError("Value of argument 0 violates contract.\n\nExpected:\n{ name: string;\n  added: Array<string>;\n  removed: Array<string>;\n}\n\nGot:\n" + _inspect(arguments[0]));
  }

  function segmentMutations(storageAccesor, storageMutator) {
    if (!(typeof storageAccesor === 'function')) {
      throw new TypeError("Value of argument \"storageAccesor\" violates contract.\n\nExpected:\nFunction\n\nGot:\n" + _inspect(storageAccesor));
    }

    if (!(typeof storageMutator === 'function')) {
      throw new TypeError("Value of argument \"storageMutator\" violates contract.\n\nExpected:\nFunction\n\nGot:\n" + _inspect(storageMutator));
    }

    var segments = undefined;

    // nothing to do here
    if (added.length === 0 && removed.length === 0) {
      return;
    }

    segments = storageAccesor(name);

    added.forEach(function (segment) {
      return segments.add(segment);
    });
    removed.forEach(function (segment) {
      return segments.delete(segment);
    });

    storageMutator(name, segments);
  }

  return _ref(segmentMutations);
}

module.exports = SegmentMutationsFactory;

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
//# sourceMappingURL=segmentChanges.js.map