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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.true(evaluation.treatment === 'off', "treatment evaluation should throw 'off'");
  assert.true(evaluation.label === 'in segment all', "label evaluation should throw 'in segment all'");
  assert.end();

});

tape('PARSER / NEGATED if user is in segment all 100%:on, then no match', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'ALL_KEYS',
        negate: true,
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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
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
    label: 'whitelisted'
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.true(evaluation === undefined, 'evaluation should throw undefined');

  evaluation = await evaluator(keyParser('u1'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', "treatment evaluation should throw 'on'");

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', "treatment should be evaluated to 'on'");

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
  assert.true(evaluation.label === 'whitelisted', "label should be evaluated to 'whitelisted'");
  assert.end();

});

tape('PARSER / NEGATED if user is in segment ["u1", "u2", "u3", "u4"] then split 100%:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'WHITELIST',
        negate: true,
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
    label: 'whitelisted'
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'on', "treatment evaluation should throw 'on'");

  evaluation = await evaluator(keyParser('u1'), 31, 100, 31);
  assert.equal(evaluation, undefined, 'evaluation should throw undefined');

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
  assert.equal(evaluation, undefined, 'evaluation should throw undefined');

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
  assert.equal(evaluation, undefined, 'evaluation should throw undefined');
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
    label: 'whitelisted'
  }]);

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v1'
  });
  assert.true(evaluation.treatment === 'on', 'v1 is defined in the whitelist');
  assert.true(evaluation.label === 'whitelisted', 'label should be "whitelisted"');

  evaluation = await evaluator(keyParser('v1'), 31, 100, 31);
  assert.true(evaluation === undefined, 'we are looking for v1 inside the account attribute');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v4'
  });
  assert.true(evaluation === undefined, 'v4 is not defined inside the whitelist');

  assert.end();

});

tape('PARSER / NEGATED if user.account is in list ["v1", "v2", "v3"] then split 100:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'account'
        },
        matcherType: 'WHITELIST',
        negate: true,
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
    label: 'whitelisted'
  }]);

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v1'
  });
  assert.true(evaluation === undefined, 'v1 is defined in the whitelist');

  evaluation = await evaluator(keyParser('v1'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', 'we are looking for v1 inside the account attribute');
  assert.true(evaluation.label === 'whitelisted', 'label should be "whitelisted"');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v4'
  });
  assert.true(evaluation.treatment === 'on', 'v4 is not defined in the whitelist');
  assert.true(evaluation.label === 'whitelisted', 'label should be "whitelisted"');

  assert.end();

});

tape('PARSER / if user.account is in segment all then split 100:on', async function (assert) {
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
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

  const evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', 'ALL_KEYS always matches');

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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 10
  });
  assert.true(evaluation.treatment === 'on', '10 is between 10 and 20');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 9
  });
  assert.true(evaluation === undefined, '9 is not between 10 and 20');

  assert.true(
    await evaluator(keyParser('test@split.io'), 31, 100, 31) === undefined,
    'undefined is not between 10 and 20'
  );

  assert.end();
});

tape('PARSER / NEGATED if user.attr is between 10 and 20 then split 100:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'BETWEEN',
        negate: true,
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 10
  });
  assert.true(evaluation === undefined, '10 is between 10 and 20');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 9
  });
  assert.true(evaluation.treatment === 'on', '9 is not between 10 and 20');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', 'undefined is not between 10 and 20');

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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947021 is equal');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947020 is less than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947022 is not less than 1458240947021');

  assert.true(
    await evaluator(keyParser('test@split.io'), 31, 100, 31) === undefined,
    'missing attributes in the parameters list'
  );

  assert.end();
});

tape('PARSER / NEGATED if user.attr <= datetime 1458240947021 then split 100:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'LESS_THAN_OR_EQUAL_TO',
        negate: true,
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947021 is equal');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947020 is less than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947022 is not less than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', 'missing attributes in the parameters list');

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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947021 is equal');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947020 is less than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947000 is greater than 1458240947021');

  assert.true(await evaluator(keyParser('test@split.io'), 31, 100, 31) === undefined,
    'missing attributes in the parameters list'
  );

  assert.end();
});

tape('PARSER / NEGATED if user.attr >= datetime 1458240947021 then split 100:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'GREATER_THAN_OR_EQUAL_TO',
        negate: true,
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T18:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947021 is equal');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T17:55:47.021Z').getTime()
  });
  assert.true(evaluation.treatment === 'on', '1458240947020 is less than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: new Date('2016-03-17T19:55:47.021Z').getTime()
  });
  assert.true(evaluation === undefined, '1458240947000 is greater than 1458240947021');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', 'missing attributes in the parameters list');

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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947021
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T18:55:47.021Z is equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T18:55:47.020Z is considered equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation.treatment, 'on', '2016-03-17T00:00:00Z is considered equal to 2016-03-17T18:55:47.021Z');

  assert.equal(await evaluator(keyParser('test@split.io'), 31, 100, 31), undefined,
    'missing attributes should be evaluated to false'
  );
  assert.end();
});

tape('PARSER / NEGATED if user.attr = datetime 1458240947021 then split 100:on, negated results', async function (assert) {

  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'attr'
        },
        matcherType: 'EQUAL_TO',
        negate: true,
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947021
  });
  assert.equal(evaluation, undefined, '2016-03-17T18:55:47.021Z is equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation, undefined, '2016-03-17T18:55:47.020Z is considered equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    attr: 1458240947020
  });
  assert.equal(evaluation, undefined, '2016-03-17T00:00:00Z is considered equal to 2016-03-17T18:55:47.021Z');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'on', 'missing attributes should be evaluated to false');

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

  let evaluation = await evaluator(keyParser('aaaaa'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'A', '20%:A'); // bucket 15

  evaluation = await evaluator(keyParser('bbbbbbbbbbbbbbbbbbb'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'B', '20%:B'); // bucket 34

  evaluation = await evaluator(keyParser('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'A', '60%:A'); // bucket 100

  assert.end();
});