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

tape('PARSER / handle invalid matcher as control', async function (assert) {
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'UNKNOWN_MATCHER',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'A',
      size: 20
    }, {
      treatment: 'B',
      size: 20
    }, {
      treatment: 'A',
      size: 60
    }]
  }]);

  let evaluation = await evaluator('aaaaa', 31);

  assert.equal(evaluation.treatment, 'control', 'return control when invalid matcher');
  assert.equal(evaluation.label, 'exception', 'track invalid as an exception');

  assert.end();
});

tape('PARSER / handle invalid matcher as control (complex example)', async function (assert) {
  const evaluator = parser([
    {
      'conditionType': 'WHITELIST',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': null,
            'matcherType': 'WHITELIST',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'whitelistMatcherData': {
              'whitelist': [
                'NicoIncluded'
              ]
            },
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'on',
          'size': 100
        }
      ],
      'label': 'whitelisted'
    },
    {
      'conditionType': 'WHITELIST',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': null,
            'matcherType': 'WHITELIST',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'whitelistMatcherData': {
              'whitelist': [
                'NicoExcluded'
              ]
            },
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'off',
          'size': 100
        }
      ],
      'label': 'whitelisted'
    },
    {
      'conditionType': 'ROLLOUT',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': {
              'trafficType': 'test',
              'attribute': 'custom'
            },
            'matcherType': 'SARASA',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'on',
          'size': 100
        },
        {
          'treatment': 'off',
          'size': 0
        }
      ],
      'label': 'custom in list [test, more test]'
    }
  ]);

  let ev1 = await evaluator('NicoIncluded', 31);
  let ev2 = await evaluator('NicoExcluded', 31);
  let ev3 = await evaluator('another_key', 31);

  for (let ev of [ ev1, ev2, ev3 ]) {
    assert.equal(ev.treatment, 'control', 'return control when invalid matcher');
    assert.equal(ev.label, 'exception', 'track invalid as an exception');
  }

  assert.end();
});

tape('PARSER / handle invalid matcher as control (complex example mixing invalid and valid matchers)', async function (assert) {
  const evaluator = parser([
    {
      'conditionType': 'WHITELIST',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': null,
            'matcherType': 'WHITELIST',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'whitelistMatcherData': {
              'whitelist': [
                'NicoIncluded'
              ]
            },
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'on',
          'size': 100
        }
      ],
      'label': 'whitelisted'
    },
    {
      'conditionType': 'WHITELIST',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            'keySelector': null,
            'matcherType': 'WHITELIST',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'whitelistMatcherData': {
              'whitelist': [
                'NicoExcluded'
              ]
            },
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'off',
          'size': 100
        }
      ],
      'label': 'whitelisted'
    },
    {
      'conditionType': 'ROLLOUT',
      'matcherGroup': {
        'combiner': 'AND',
        'matchers': [
          {
            keySelector: {
              trafficType: 'user',
              attribute: 'account'
            },
            matcherType: 'ALL_KEYS',
            negate: false,
            userDefinedSegmentMatcherData: null,
            whitelistMatcherData: null,
            unaryNumericMatcherData: null,
            betweenMatcherData: null,
            unaryStringMatcherData: null
          },
          {
            'keySelector': {
              'trafficType': 'test',
              'attribute': 'custom'
            },
            'matcherType': 'SARASA',
            'negate': false,
            'userDefinedSegmentMatcherData': null,
            'unaryNumericMatcherData': null,
            'betweenMatcherData': null
          },
          {
            keySelector: {
              trafficType: 'user',
              attribute: 'account'
            },
            matcherType: 'ALL_KEYS',
            negate: false,
            userDefinedSegmentMatcherData: null,
            whitelistMatcherData: null,
            unaryNumericMatcherData: null,
            betweenMatcherData: null,
            unaryStringMatcherData: null
          }
        ]
      },
      'partitions': [
        {
          'treatment': 'on',
          'size': 100
        },
        {
          'treatment': 'off',
          'size': 0
        }
      ],
      'label': 'custom in list [test, more test]'
    }
  ]);

  let ev1 = await evaluator('NicoIncluded', 31);
  let ev2 = await evaluator('NicoExcluded', 31);
  let ev3 = await evaluator('another_key', 31);

  for (let ev of [ ev1, ev2, ev3 ]) {
    assert.equal(ev.treatment, 'control', 'return control when invalid matcher');
    assert.equal(ev.label, 'exception', 'track invalid as an exception');
  }

  assert.end();
});
