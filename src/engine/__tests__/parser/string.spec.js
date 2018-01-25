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
import tape from 'tape';
import parser from '../../parser';
import keyParser from '../../../utils/key/parser';

//
// STARTS WITH
//
tape('PARSER / if user.email starts with ["nico"] then split 100:on', async function (assert) {
  const label = 'email starts with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email = 123, starts with ["1"] then split 100:on should match', async function (assert) {
  const label = 'email starts with ["1"]';
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
        whitelistMatcherData: {
          whitelist: ['1']
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
    email: 123
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email starts with ["nico", "marcio", "facu"] then split 100:on', async function (assert) {
  const label = 'email starts with ["nico", "marcio", "facu"]';
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
        whitelistMatcherData: {
          whitelist: ['nico', 'marcio', 'facu']
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
    email: 'facundo@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email starts with ["nico", "marcio", "facu"] then split 100:on', async function (assert) {
  const label = 'email starts with ["nico", "marcio", "facu"]';
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
        whitelistMatcherData: {
          whitelist: ['nico', 'marcio', 'facu']
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
    email: 'marciomisi@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email does not start with ["nico"] then not match', async function (assert) {
  const label = 'email starts with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
        }
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
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is an EMPTY string, start with ["nico"] should not match', async function (assert) {
  const label = 'email starts with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: ''
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is not a string, start with ["nico"] should not match', async function (assert) {
  const label = 'email starts with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: {}
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  assert.end();
});

tape('PARSER / NEGATED if user.email starts with ["nico"] then split 100:on, so not match', async function (assert) {
  const label = 'not email starts with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / NEGATED if user.email does not start with ["nico"] should not match, then match', async function (assert) {
  const label = 'not email starts with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: 'facundo@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / NEGATED if user.email is an EMPTY string, start with ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email starts with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: ''
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / NEGATED if user.email is not a string, start with ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email starts with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'STARTS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: /asd4?/
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  assert.end();
});

//
// ENDS WITH
//
tape('PARSER / if user.email ends with ["split.io"] then split 100:on', async function (assert) {
  const label = 'email ends with ["split.io"]';
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
        whitelistMatcherData: {
          whitelist: ['split.io']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email = 123, ends with ["3"] then split 100:on should match', async function (assert) {
  const label = 'email starts with ["3"]';
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
        whitelistMatcherData: {
          whitelist: ['3']
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
    email: 123
  });

  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email ends with ["gmail.com", "split.io", "hotmail.com"] then split 100:on', async function (assert) {
  const label = 'email ends with ["gmail.com", "split.io", "hotmail.com"]';
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
        whitelistMatcherData: {
          whitelist: ['gmail.com','split.io', 'hotmail.com']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email ends with ["gmail.com", "split.io", "hotmail.com"] then split 100:on', async function (assert) {
  const label = 'email ends with ["gmail.com", "split.io", "hotmail.com"]';
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
        whitelistMatcherData: {
          whitelist: ['gmail.com','split.io', 'hotmail.com']
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
    email: 'nicolas.zelaya@hotmail.com'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email ends with ["gmail.com", "split.io", "hotmail.com"] but attribute is "" then split 100:on', async function (assert) {
  const label = 'email ends with ["gmail.com", "split.io", "hotmail.com"]';
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
        whitelistMatcherData: {
          whitelist: ['gmail.com','split.io', 'hotmail.com']
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
    email: ''
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email does not end with ["split.io"] then not match', async function (assert) {
  const label = 'email ends with ["split.io"]';
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
        whitelistMatcherData: {
          whitelist: ['split.io']
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
    email: 'facundo@gmail.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is an EMPTY string, end with ["nico"] should not match', async function (assert) {
  const label = 'email ends with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: ''
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is not a string, end with ["nico"] should not match', async function (assert) {
  const label = 'email ends with ["nico"]';
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
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: []
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: 'nicole'
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  assert.end();
});

tape('PARSER / NEGATED if user.email ends with ["split.io"] then split 100:on, so not match', async function (assert) {
  const label = 'not email ends with ["split.io"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['split.io']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / NEGATED if user.email does not end with ["split.io"] then no match, so match', async function (assert) {
  const label = 'not email ends with ["split.io"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['split.io']
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
    email: 'facundo@gmail.io'
  });

  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / NEGATED if user.email is an EMPTY string, end with ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email ends with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: ''
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / NEGATED if user.email is not a string, end with ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email ends with ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'ENDS_WITH',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: NaN
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  assert.end();
});

//
// CONTAINS STRING
//
tape('PARSER / if user.email contains ["@split"] then split 100:on', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email = 123, contains ["2"] then split 100:on should match', async function (assert) {
  const label = 'email contains ["2"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['2']
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
    email: 123
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / if user.email contains ["@split"] (beginning) then split 100:on', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: '@split.io.com.ar'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains ["@split"] (end) then split 100:on', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: 'nicolas.zelaya@split'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains ["@split"] (whole string matches) then split 100:on', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: '@split'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains ["@split", "@gmail", "@hotmail"] then split 100:on', async function (assert) {
  const label = 'email contains ["@split", "@gmail", "@hotmail"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split', '@gmail', '@hotmail']
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
    email: 'nico@hotmail.com'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains ["@split", "@gmail", "@hotmail"] then split 100:on', async function (assert) {
  const label = 'email contains ["@split", "@gmail", "@hotmail"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split', '@gmail', '@hotmail']
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
    email: 'nico@gmail.com'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email does not contain ["@split"] then not match', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: 'facundo@gmail.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is an EMPTY string, contains ["nico"] should not match', async function (assert) {
  const label = 'email contains ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: ''
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / if user.email is not a string, contains ["nico"] should not match', async function (assert) {
  const label = 'email contains ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: false,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }]
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: null
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: new Set()
  });
  assert.equal(evaluation, undefined, 'evaluator should return undefined');

  assert.end();
});

tape('PARSER / NEGATED if user.email contains ["@split"] then split 100:on, then no match', async function (assert) {
  const label = 'not email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: 'nicolas.zelaya@split.io'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation, undefined, 'evaluator should return undefined');
  assert.end();
});

tape('PARSER / NEGATED if user.email does not contain ["@split"] then not match, so match', async function (assert) {
  const label = 'email contains ["@split"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['@split']
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
    email: 'facundo@gmail.io'
  });

  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / NEGATED if user.email is an EMPTY string, contains ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email contains ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
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
    email: ''
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');
  assert.end();
});

tape('PARSER / NEGATED if user.email is not a string, contains ["nico"] should not match, so negation should', async function (assert) {
  const label = 'not email contains ["nico"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'email'
        },
        matcherType: 'CONTAINS_STRING',
        negate: true,
        userDefinedSegmentMatcherData: null,
        whitelistMatcherData: {
          whitelist: ['nico']
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  let evaluation = await evaluator(keyParser('a key'), 31, 100, 31, {
    email: () => {}
  });
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  evaluation = await evaluator(keyParser('a key'), 31, 100, 31);
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, 'evaluator should return correct label');

  assert.end();
});