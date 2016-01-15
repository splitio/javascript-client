'use strict';

var parser = require('splitio-engine/src/parser/condition');
var tape = require('tape');

tape('if user is in segment all 100%:on', function (assert) {

  var {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "matcherType": "ALL_KEYS",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('a key'), 'evaluator should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});

tape('if user is in segment all 100%:off', function (assert) {

  var {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "matcherType": "ALL_KEYS",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 0
    }, {
      "treatment": "off",
      "size": 100
    }]
  }]);

  assert.false(evaluator('a key'), 'evaluator should be evaluated to false');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});

tape('if user is in segment ["u1", " u2", " u3", " u4"] then split 100%:on', function (assert) {

  var {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "matcherType": "WHITELIST",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": {
          "whitelist": [
            "u1",
            "u2",
            "u3",
            "u4"
          ]
        }
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.false(evaluator('a key'), 'should be evaluated to false');
  assert.true(evaluator('u1'), 'should be evaluated to true');
  assert.true(evaluator('u3'), 'should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});

tape('if user is in segment employees 50%:on', function (assert) {

  var {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "matcherType": "IN_SEGMENT",
        "negate": false,
        "userDefinedSegmentMatcherData": {
          "segmentName": "employees"
        },
        "whitelistMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 50
    }, {
      "treatment": "control",
      "size": 50
    }]
  }]);

  // assert.false(evaluator('a key'), 'evaluator should be evaluated to false');
  assert.true(segments.has('employees'), `segment employees should be present`);

  assert.end();
});
