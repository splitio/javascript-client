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

//
// EQUAL_TO_SET
//
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

tape('PARSER / if user.permissions ["1", 2] equal to set ["1", "2"] then split 100:on', async function (assert) {
  const label = 'permissions = ["1", "2"]';
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
          whitelist: ["1", "2"]
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
    permissions: ["1", 2]
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return undefined");
  assert.equal(evaluation.label, label, "label should be correct");
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

tape('PARSER / if user.countries ["argentina", "usa"] equal to set ["usa","argentina"] then split 100:on', async function (assert) {
  const label = 'countries = ["usa","argentina"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'countries'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["usa","argentina"]
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
    countries: ["argentina", "usa"]
  });

  assert.equal(evaluation.treatment, 'on', "treatment should be 'on'");
  assert.equal(evaluation.label, label, 'label should match');
  assert.end();
});

tape('PARSER / if attribute is not an array we should not match equal to set', async function (assert) {
  const label = 'countries = ["usa","argentina"]';
  const evaluator = parser([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        keySelector: {
          trafficType: 'user',
          attribute: 'countries'
        },
        matcherType: 'EQUAL_TO_SET',
        negate: false,
        userDefinedSegmentMatcherData: null,
        unaryStringMatcherData: null,
        whitelistMatcherData: {
          whitelist: ["usa","argentina"]
        }
      }]
    },
    partitions: [{
      treatment: 'on',
      size: 100
    }],
    label: label
  }]);

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.equal(evaluation, undefined, "evaluator should not match");
  assert.end();
});

//
// CONTAINS_ALL_OF_SET
//
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

tape('PARSER / if user.permissions [1, "edit", "delete"] contains all of set ["1", "edit"] then split 100:on', async function (assert) {
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
          whitelist: ["1", "edit"]
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
    permissions: [1, "edit", "delete"]
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

tape('PARSER / if attribute is not an array we should not match contains all', async function (assert) {
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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.equal(evaluation, undefined, "evaluator should not match");
  assert.end();
});

//
// PART_OF_SET
//
tape('PARSER / if user.permissions [] is part of set ["read", "edit", "delete"] then split 100:on', async function (assert) {
  const label = 'permissions part of ["read", "edit", "delete"]';
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
    permissions: []
  });

  assert.equal(evaluation, undefined, "Empty set should not match 'part of'");
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

tape('PARSER / if user.permissions [1, "edit"] is part of set ["1", "edit", "delete"] then split 100:on', async function (assert) {
  const label = 'permissions part of ["1", "edit", "delete"]'
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
          whitelist: ["1", "edit", "delete"]
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
    permissions: [1, "edit"]
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

tape('PARSER / if attribute is not an array we should not match part of', async function (assert) {
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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});

//
// CONTAINS_ANY_OF_SET
//
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

tape('PARSER / if user.permissions ["admin", 1] contains any of set ["read", "1", "delete"] then split 100:on', async function (assert) {
  const label = 'permissions part of ["read", "1", "delete"]'
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
          whitelist: ["read", "1", "delete"]
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
    permissions: ["admin", 1]
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

tape('PARSER / if attribute is not an array we should not match contains any', async function (assert) {
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

  const evaluation = await evaluator(keyParser('a key'), 31, 100, 31);

  assert.equal(evaluation, undefined, "evaluator should return undefined");
  assert.end();
});
