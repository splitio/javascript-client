'use strict';

var tape = require('tape');
var engine = require('../../../lib/engine');
var partitionTypes = require('../../../lib/partitions/types');
var keys = require('./mocks/1000_keys_10_chart_length');

tape('The engine should evaluates always true', function (assert) {
  var partitions = new Map().set(partitionTypes.enum.ON, 100);
  var okCounter = 0;
  var failCounter = 0;

  var startTime = Date.now();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var k = _step.value;

      engine.isOn(k, 424344136, partitions) ? okCounter++ : failCounter++;
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

  var endTime = Date.now();

  assert.true(okCounter === 1000, 'ALL keys should evaluate to true');
  assert.true(failCounter === 0, 'ANY keys should evaluate to false');
  assert.comment('Evaluation takes ' + (endTime - startTime) / 1000 + ' seconds');
  assert.end();
});

tape('The engine should evaluates half true and half false', function (assert) {
  var partitions = new Map().set(partitionTypes.enum.ON, 50);
  var okCounter = 0;
  var failCounter = 0;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var k = _step2.value;

      if (engine.isOn(k, 424344136, partitions)) {
        okCounter++;
      } else {
        failCounter++;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var total = keys.length;
  var percentageOk = okCounter * 100 / total;
  var percentageFail = failCounter * 100 / total;

  var inf = 50 - engine.TOLERANCE;
  var sup = 50 + engine.TOLERANCE;

  assert.true(inf <= percentageOk && percentageOk <= sup, 'OK should be between(49.9, 50.1): ' + percentageOk);
  assert.true(inf <= percentageFail && percentageFail <= sup, 'FAIL should be between(49.9, 50.1): ' + percentageFail);
  assert.end();
});
//# sourceMappingURL=index.spec.js.map