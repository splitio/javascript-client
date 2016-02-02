'use strict';

const TREATMENT = require('../../../lib/treatments/reserved');

let parser = require('../../../lib/parser/condition');
let tape = require('tape');

tape('if user is in segment all 100%:on', function (assert) {

  let {evaluator, segments} = parser([{
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

  assert.true(TREATMENT.isOn(evaluator('a key')), 'evaluator should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});

tape('if user is in segment all 100%:off', function (assert) {

  let {evaluator, segments} = parser([{
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

  assert.false(TREATMENT.isOn(evaluator('a key')), 'evaluator should be evaluated to false');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});

tape('if user is in segment ["u1", " u2", " u3", " u4"] then split 100%:on', function (assert) {

  let {evaluator, segments} = parser([{
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

  assert.false(TREATMENT.isOn(evaluator('a key')), 'should be evaluated to false');
  assert.true(TREATMENT.isOn(evaluator('u1')), 'should be evaluated to true');
  assert.true(TREATMENT.isOn(evaluator('u3')), 'should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');

  assert.end();
});
