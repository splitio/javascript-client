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
const keyParser = require('../../../utils/key/parser');

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

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.true(evaluation === undefined, 'evaluation should throw undefined');

  evaluation = await evaluator(keyParser('u1'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', "treatment evaluation should throw 'on'");

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
  assert.true(evaluation.treatment === 'on', "treatment should be evaluated to 'on'");

  evaluation = await evaluator(keyParser('u3'), 31, 100, 31);
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v1'
  });
  assert.true(evaluation.treatment === 'on', 'v1 is defined in the whitelist');
  assert.true(evaluation.label === 'explicitly included', 'label should be "explicitly included"');

  evaluation = await evaluator(keyParser('v1'), 31, 100, 31);
  assert.true(evaluation === undefined, 'we are looking for v1 inside the account attribute');

  evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
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

  let evaluation = await evaluator(keyParser('test@split.io'), 31, 100, 31, {
    account: 'v1'
  });
  assert.true(evaluation.treatment === 'on', 'v1 is defined in segment all');

  assert.true(await evaluator(keyParser('test@split.io'), 31, 100, 31) === undefined, 'missing attribute should evaluates to undefined');

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

tape('PARSER / if user.email starts with "nico" then split 100:on', async function (assert) {
  const label = 'email starts with [nico]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: {
          value: 'nico'
        },
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return correct label");
  assert.end();
});

tape('PARSER / if user.email does not start with "nico" then not match', async function (assert) {
  const label = 'email starts with [nico]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: {
          value: 'nico'
        },
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: 'facundo@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.email ends with "split.io" then split 100:on', async function (assert) {
  const label = 'email ends with [split.io]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: {
          value: 'split.io'
        },
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email does not end with "split.io" then not match', async function (assert) {
  const label = 'email ends with [split.io]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: {
          value: 'split.io'
        },
        whitelistMatcherData: null
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: 'facundo@gmail.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "write"] equal to set ["read", "write"] then split 100:on', async function (assert) {
  const label = 'permissions = ["read", "write"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "write"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "write"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return correct label");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "write", "delete"] equal to set ["read", "write"] then not match', async function (assert) {
  const label = 'permissions = ["read", "write"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "write"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "write", "delete"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.permissions ["read"] equal to set ["read", "write"] then not match', async function (assert) {
  const label = 'permissions = ["read", "write"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "write"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "delete"] equal to set ["read", "write"] then not match', async function (assert) {
  const label = 'permissions = ["read", "write"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "write"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "delete"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "edit", "delete"] contains all of set ["read", "edit"] then split 100:on', async function (assert) {
  const label = 'permissions contains ["read", "edit"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'CONTAINS_ALL_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "edit", "delete"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return correct label");
  assert.end();
});

tape('PARSER / if user.permissions ["read"] contains all of set ["read", "edit"] then not match', async function (assert) {
  const label = 'permissions contains ["read", "edit"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'CONTAINS_ALL_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should not match");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "delete", "manage"] contains all of set ["read", "edit"] then not match', async function (assert) {
  const label = 'permissions contains ["read", "edit"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'CONTAINS_ALL_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "delete", "manage"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should not match");
  assert.end();
});

tape('PARSER / if user.permissions ["read", "edit"] is part of set ["read", "edit", "delete"] then split 100:on', async function (assert) {
  const label = 'permissions part of ["read", "edit", "delete"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'PART_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit", "delete"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["read", "edit"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return correct label");
  assert.end();
});

tape('PARSER / if user.permissions ["admin", "magic"] is part of set ["read", "edit"] then not match', async function (assert) {
  const label = 'permissions part of ["read", "edit"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'PART_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["admin", "magic"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

tape('PARSER / if user.permissions ["admin", "edit"] contains any of set ["read", "edit", "delete"] then split 100:on', async function (assert) {
  const label = 'permissions part of ["read", "edit", "delete"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'CONTAINS_ANY_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit", "delete"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["admin", "edit"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return correct label");
  assert.end();
});

tape('PARSER / if user.permissions ["admin", "magic"] contains any of set ["read", "edit"] then not match', async function (assert) {
  const label = 'permissions part of ["read", "edit"]'
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'permissions'
        },
        matcherType: 'CONTAINS_ANY_OF_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["read", "edit"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    permissions: ["admin", "magic"]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, "evaluator should return undefined");
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

tape('PARSER / handle invalid matcher as control (complex example mixing invalid and valid matchers)', async function (assert) {
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
            "keySelector": {
              "trafficType": "test",
              "attribute": "custom"
            },
            "matcherType": "SARASA",
            "negate": false,
            "userDefinedSegmentMatcherData": null,
            "unaryNumericMatcherData": null,
            "betweenMatcherData": null
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
