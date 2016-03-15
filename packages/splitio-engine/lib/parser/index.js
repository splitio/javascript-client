'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
var matcherGroupTransform = require('../transforms/matcherGroup');
var treatmentsParser = require('../treatments').parse;

var matcherTypes = require('../matchers/types').enum;
var matcherFactory = require('../matchers');

var evaluatorFactory = require('../evaluator');

var andCombiner = require('../combiners/and');

/*::
  type ParserOutputDTO = {
    segments: Set,
    evaluator: (key: string, seed: number) => boolean
  }
*/

// Collect segments and create the evaluator function given a list of
// conditions. This code is the base used by the class `Split` for
// instanciation.
function parse(conditions /*: Iterable<Object> */, storage /*: Storage */) /*: ParserOutputDTO */{
  var predicates = [];
  var segments = new _set2.default();
  var evaluator = null;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(conditions), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var condition = _step.value;

      var matcherMetadata = matcherGroupTransform(condition.matcherGroup);
      var matcherEvaluator = matcherFactory(matcherMetadata, storage);
      var treatments = treatmentsParser(condition.partitions);

      // Incrementally collect segmentNames
      if (matcherMetadata.type === matcherTypes.SEGMENT) {
        segments.add(matcherMetadata.value);
      }

      predicates.push(evaluatorFactory(matcherEvaluator, treatments));
    }

    // Instanciate evaluator given the set of conditions
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

  evaluator = andCombiner(predicates);

  return {
    segments: segments,
    evaluator: evaluator
  };
}

module.exports = parse;
//# sourceMappingURL=index.js.map