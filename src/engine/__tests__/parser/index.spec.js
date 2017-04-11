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
'use strict';

const tape = require('tape');
const parser = require('../../parser');

tape('PARSER / if user is in segment all 100%:on', async function (assert) {

  const evaluator = parser([{
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

  const evaluation = await evaluator('a key', 31);

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, 'in segment all', "evaluator should return label 'in segment all'");
  assert.end();

});

tape('PARSER / if user is in segment all 100%:off', async function (assert) {

  const evaluator = parser([{
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
    }],
    label: 'in segment all'
  }]);

  const evaluation = await evaluator('a key', 31);

  assert.true(evaluation.treatment === 'off', "treatment evaluation should throw 'off'");
  assert.true(evaluation.label === 'in segment all', "label evaluation should throw 'in segment all'");
  assert.end();

});

tape('PARSER / if user is in segment ["u1", "u2", "u3", "u4"] then split 100%:on', async function (assert) {

  const evaluator = parser([{
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
    }],
    label: 'explicitly included'
  }]);

  let evaluation = await evaluator('a key', 31);
  assert.true(evaluation === undefined, 'evaluation should throw undefined');

  evaluation = await evaluator('u1', 31);
  assert.true(evaluation.treatment === 'on', "treatment evaluation should throw 'on'");

  evaluation = await evaluator('u3', 31);
  assert.true(evaluation.treatment === 'on', "treatment should be evaluated to 'on'");

  evaluation = await evaluator('u3', 31);
  assert.true(evaluation.label === 'explicitly included', "label should be evaluated to 'explicitly included'");
  assert.end();

});

tape('PARSER / if user.account is in list ["v1", "v2", "v3"] then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'account'
        },
        matcherType: 'WHITELIST',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: [
            'v1',
            'v2',
            'v3'
          ]
        },
        unaryNumericMatcherData: null,
        betweenMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: 'explicitly included'
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    account: 'v1'
  });
  assert.true(evaluation.treatment === 'on', 'v1 is defined in the whitelist');
  assert.true(evaluation.label === 'explicitly included', 'label should be "explicitly included"');

  evaluation = await evaluator('v1', 31);
  assert.true(evaluation === undefined, 'we are looking for v1 inside the account attribute');

  evaluation = await evaluator('test@split.io', 31, {
    account: 'v4'
  });
  assert.true(evaluation === undefined, 'v4 is not defined inside the whitelist');

  assert.end();

});

tape('PARSER / if user.account is in segment all then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
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
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: 'in segment all'
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    account: 'v1'
  });
  assert.true(evaluation.treatment === 'on', 'v1 is defined in segment all');

  assert.true(await evaluator('test@split.io', 31) === undefined, 'missing attribute should evaluates to undefined');

  assert.end();
});

tape('PARSER / if user.attr is between 10 and 20 then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'BETWEEN',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null,
        unaryNumericMatcherData: null,
        betweenMatcherData: {
          dataType: 'NUMBER',
          start: 10,
          end: 20
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    attr: 10
  });
  assert.true(evaluation.treatment === 'on', '10 is between 10 and 20');

  evaluation = await evaluator('test@split.io', 31, {
    attr: 9
  });
  assert.true(evaluation === undefined, '9 is not between 10 and 20');

  assert.true(
    await evaluator('test@split.io', 31) === undefined,
    'undefined is not between 10 and 20'
  );

  assert.end();
});

tape('PARSER / if user.attr <= datetime 1458240947021 then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'LESS_THAN_OR_EQUAL_TO',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null,
        unaryNumericMatcherData: {
          dataType: 'DATETIME',
          value: 1458240947021
        },
        betweenMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947021 is equal');

  evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947020 is less than 1458240947021');

  evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947022 is not less than 1458240947021');

  assert.true(
    await evaluator('test@split.io', 31) === undefined,
    'missing attributes in the parameters list'
  );

  assert.end();
});

tape('PARSER / if user.attr >= datetime 1458240947021 then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'GREATER_THAN_OR_EQUAL_TO',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null,
        unaryNumericMatcherData: {
          dataType: 'DATETIME',
          value: 1458240947021
        },
        betweenMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947021 is equal');

  evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947020 is less than 1458240947021');

  evaluation = await evaluator('test@split.io', 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947000 is greater than 1458240947021');

  assert.true(await evaluator('test@split.io', 31) === undefined,
    'missing attributes in the parameters list'
  );

  assert.end();
});

tape('PARSER / if user.attr = datetime 1458240947021 then split 100:on', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'EQUAL_TO',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: null,
        unaryNumericMatcherData: {
          dataType: 'DATETIME',
          value: 1458240947021
        },
        betweenMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator('test@split.io', 31, {
    attr: 1458240947021
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T18:55:47.021Z is equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator('test@split.io', 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T18:55:47.020Z is considered equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator('test@split.io', 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T00:00:00Z is considered equal to 2016-03-17T18:55:47.021Z');

  assert.equal(await evaluator('test@split.io', 31), undefined,
    'missing attributes should be evaluated to false'
  );
  assert.end();
});

tape('PARSER / if user is in segment all then split 20%:A,20%:B,60%:A', async function (assert) {
  const evaluator = parser([{
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
  assert.equal(evaluation.treatment, 'A', '20%:A'); // bucket 15

  evaluation = await evaluator('bbbbbbbbbbbbbbbbbbb', 31);
  assert.equal(evaluation.treatment, 'B', '20%:B'); // bucket 34

  evaluation = await evaluator('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 31);
  assert.equal(evaluation.treatment, 'A', '60%:A'); // bucket 100

  assert.end();
});

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
      "conditionType": "WHITELIST",
      "matcherGroup": {
        "combiner": "AND",
        "matchers": [
          {
            "keySelector": null,
            "matcherType": "WHITELIST",
            "negate": false,
            "userDefinedSegmentMatcherData": null,
            "whitelistMatcherData": {
              "whitelist": [
                "NicoIncluded"
              ]
            },
            "unaryNumericMatcherData": null,
            "betweenMatcherData": null
          }
        ]
      },
      "partitions": [
        {
          "treatment": "on",
          "size": 100
        }
      ],
      "label": "explicitly included"
    },
    {
      "conditionType": "WHITELIST",
      "matcherGroup": {
        "combiner": "AND",
        "matchers": [
          {
            "keySelector": null,
            "matcherType": "WHITELIST",
            "negate": false,
            "userDefinedSegmentMatcherData": null,
            "whitelistMatcherData": {
              "whitelist": [
                "NicoExcluded"
              ]
            },
            "unaryNumericMatcherData": null,
            "betweenMatcherData": null
          }
        ]
      },
      "partitions": [
        {
          "treatment": "off",
          "size": 100
        }
      ],
      "label": "explicitly included"
    },
    {
      "conditionType": "ROLLOUT",
      "matcherGroup": {
        "combiner": "AND",
        "matchers": [
          {
            "keySelector": {
              "trafficType": "test",
              "attribute": "custom"
            },
            "matcherType": "SARASA",
            "negate": false,
            "userDefinedSegmentMatcherData": null,
            "unaryNumericMatcherData": null,
            "betweenMatcherData": null
          }
        ]
      },
      "partitions": [
        {
          "treatment": "on",
          "size": 100
        },
        {
          "treatment": "off",
          "size": 0
        }
      ],
      "label": "custom in list [test, more test]"
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
