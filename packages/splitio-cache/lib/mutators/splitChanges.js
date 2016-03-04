'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _hasInstance = require('babel-runtime/core-js/symbol/has-instance');

var _hasInstance2 = _interopRequireDefault(_hasInstance);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Split = require('@splitsoftware/splitio-engine');
var parse = Split.parse;

var PartitionDTO = function () {
  function PartitionDTO(input) {
    return input != null && typeof input.treatment === 'string' && typeof input.size === 'number';
  }

  ;
  (0, _defineProperty2.default)(PartitionDTO, _hasInstance2.default, {
    value: function value(input) {
      return PartitionDTO(input);
    }
  });
  return PartitionDTO;
}();

var MatcherDTO = function () {
  function MatcherDTO(input) {
    return input != null && typeof input.matcherType === 'string' && typeof input.negate === 'boolean';
  }

  ;
  (0, _defineProperty2.default)(MatcherDTO, _hasInstance2.default, {
    value: function value(input) {
      return MatcherDTO(input);
    }
  });
  return MatcherDTO;
}();

var MatcherGroupDTO = function () {
  function MatcherGroupDTO(input) {
    return input != null && typeof input.combiner === 'string' && Array.isArray(input.matchers) && input.matchers.every(function (item) {
      return MatcherDTO(item);
    });
  }

  ;
  (0, _defineProperty2.default)(MatcherGroupDTO, _hasInstance2.default, {
    value: function value(input) {
      return MatcherGroupDTO(input);
    }
  });
  return MatcherGroupDTO;
}();

var ConditionDTO = function () {
  function ConditionDTO(input) {
    return input != null && MatcherGroupDTO(input.matcherGroup) && Array.isArray(input.partitions) && input.partitions.every(function (item) {
      return PartitionDTO(item);
    });
  }

  ;
  (0, _defineProperty2.default)(ConditionDTO, _hasInstance2.default, {
    value: function value(input) {
      return ConditionDTO(input);
    }
  });
  return ConditionDTO;
}();

var SplitDTO = function () {
  function SplitDTO(input) {
    return input != null && typeof input.name === 'string' && typeof input.seed === 'number' && typeof input.status === 'string' && typeof input.killed === 'boolean' && typeof input.defaultTreatment === 'string' && Array.isArray(input.conditions) && input.conditions.every(function (item) {
      return ConditionDTO(item);
    });
  }

  ;
  (0, _defineProperty2.default)(SplitDTO, _hasInstance2.default, {
    value: function value(input) {
      return SplitDTO(input);
    }
  });
  return SplitDTO;
}();

var SplitDTOCollection = function () {
  function SplitDTOCollection(input) {
    return Array.isArray(input) && input.every(function (item) {
      return SplitDTO(item);
    });
  }

  ;
  (0, _defineProperty2.default)(SplitDTOCollection, _hasInstance2.default, {
    value: function value(input) {
      return SplitDTOCollection(input);
    }
  });
  return SplitDTOCollection;
}();

function SplitMutationsFactory(splits) {
  function _ref(_id) {
    if (!(typeof _id === 'function')) {
      throw new TypeError('Function "SplitMutationsFactory" return value violates contract.\n\nExpected:\nFunction\n\nGot:\n' + _inspect(_id));
    }

    return _id;
  }

  if (!SplitDTOCollection(splits)) {
    throw new TypeError('Value of argument "splits" violates contract.\n\nExpected:\nArray<SplitDTO>\n\nGot:\n' + _inspect(splits));
  }

  function splitMutations(storage, storageMutator) {
    if (!(typeof storageMutator === 'function')) {
      throw new TypeError('Value of argument "storageMutator" violates contract.\n\nExpected:\nFunction\n\nGot:\n' + _inspect(storageMutator));
    }

    storageMutator(splits.map(function (split) {
      return parse(split, storage);
    }));
  }

  return _ref(splitMutations);
}

module.exports = SplitMutationsFactory;

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
//# sourceMappingURL=splitChanges.js.map