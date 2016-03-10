const parser = require('../../../lib/parser');
const tape = require('tape');

tape('PARSER / if user is in segment all 100%:on', assert => {

  let {evaluator, segments} = parser([{
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

  assert.true(evaluator('a key', 31) === 'on', "evaluation should throw 'on'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();

});

tape('PARSER / if user is in segment all 100%:off', assert => {

  let {evaluator, segments} = parser([{
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

  assert.true(evaluator('a key', 31) === 'off', "evaluation should throw 'off'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();

});

tape("PARSER / if user is in segment ['u1', ' u2', ' u3', ' u4'] then split 100%:on", assert => {

  let {evaluator, segments} = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'WHITELIST',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: [
            'u1',
            'u2',
            'u3',
            'u4'
          ]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  assert.true(evaluator('a key', 31) === undefined, 'evaluation should throw undefined');
  assert.true(evaluator('u1', 31) === 'on', "evaluation should throw 'on'");
  assert.true(evaluator('u3', 31) === 'on', "should be evaluated to 'on'");
  assert.true(segments.size === 0, 'there is no segment present in the definition');
  assert.end();

});
