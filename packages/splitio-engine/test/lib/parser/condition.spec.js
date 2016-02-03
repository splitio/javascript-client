'use strict';

var TREATMENT = require('../../../lib/treatments/reserved');

var parser = require('../../../lib/parser/condition');
var tape = require('tape');

tape('if user is in segment all 100%:on', function (assert) {
  var _parser = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'ALL_KEYS',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  var evaluator = _parser.evaluator;
  var segments = _parser.segments;

  assert.true(TREATMENT.isOn(evaluator('a key')), 'evaluator should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});

tape('if user is in segment all 100%:off', function (assert) {
  var _parser2 = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'ALL_KEYS',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 0
    }, {
      treatment: 'off',
      size: 100
    }]
  }]);

  var evaluator = _parser2.evaluator;
  var segments = _parser2.segments;

  assert.false(TREATMENT.isOn(evaluator('a key')), 'evaluator should be evaluated to false');
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});

tape("if user is in segment ['u1', ' u2', ' u3', ' u4'] then split 100%:on", function (assert) {
  var _parser3 = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'WHITELIST',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['u1', 'u2', 'u3', 'u4']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  var evaluator = _parser3.evaluator;
  var segments = _parser3.segments;

  assert.false(TREATMENT.isOn(evaluator('a key')), 'should be evaluated to false');
  assert.true(TREATMENT.isOn(evaluator('u1')), 'should be evaluated to true');
  assert.true(TREATMENT.isOn(evaluator('u3')), 'should be evaluated to true');
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();
});
//# sourceMappingURL=condition.spec.js.map