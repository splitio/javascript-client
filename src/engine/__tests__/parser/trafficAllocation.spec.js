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
import tape from 'tape-catch';
import parser from '../../parser';
import keyParser from '../../../utils/key/parser';

tape('PARSER / if user is in segment all 100%:on but trafficAllocation is 0%', async function (assert) {

  const evaluator = parser([{
    conditionType: 'ROLLOUT',
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
    }],
    label: 'in segment all'
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 0, 31);

  assert.equal(evaluation.treatment, undefined, 'treatment should be undefined');
  assert.equal(evaluation.label, 'not in split', 'label should be fixed string');
  assert.end();
});

tape('PARSER / if user is in segment all 100%:on but trafficAllocation is 99% with bucket below 99', async function (assert) {

  const evaluator = parser([{
    conditionType: 'ROLLOUT',
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
    }],
    label: 'in segment all'
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 99, 31);

  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on' as traffic allocation is bigger than bucket result");
  assert.equal(evaluation.label, 'in segment all', "evaluator should return label 'in segment all'");
  assert.end();
});

tape('PARSER / if user is in segment all 100%:on but trafficAllocation is 99% and bucket returns 100', async function (assert) {

  const evaluator = parser([{
    conditionType: 'ROLLOUT',
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
    }],
    label: 'in segment all'
  }]);

  const evaluation = await evaluator(keyParser('aaaaa'), 31, 99, 14);

  assert.equal(evaluation.treatment, undefined, 'treatment should be undefined');
  assert.equal(evaluation.label, 'not in split', 'label should be fixed string');
  assert.end();
});

tape('PARSER / if user is whitelisted and in segment all 100%:off with trafficAllocation as 0%', async function (assert) {

  const evaluator = parser([{
    conditionType: 'WHITELIST',
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'WHITELIST',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: [
            'a key'
          ]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: 'whitelisted'
  }, {
    conditionType: 'ROLLOUT',
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
      treatment: 'off',
      size: 100
    }],
    label: 'in segment all'
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 0, 31);

  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on' as whitelisting has more priority than traffic allocation");
  assert.equal(evaluation.label, 'whitelisted', "evaluator should return label 'whitelisted'");
  assert.end();
});
