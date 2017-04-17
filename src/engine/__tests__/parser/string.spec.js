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

tape('PARSER / if user.email contains "@split" then split 100:on', async function (assert) {
  const label = 'email contains [@split]';
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
        unaryStringMatcherData: {
          value: '@split'
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

tape('PARSER / if user.email contains "@split" (beginning) then split 100:on', async function (assert) {
  const label = 'email contains [@split]';
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
        unaryStringMatcherData: {
          value: '@split'
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
    email: '@split.io.com.ar'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains "@split" (end) then split 100:on', async function (assert) {
  const label = 'email contains [@split]';
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
        unaryStringMatcherData: {
          value: '@split'
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
    email: 'nicolas.zelaya@split'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email contains "@split" (whole string matches) then split 100:on', async function (assert) {
  const label = 'email contains [@split]';
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
        unaryStringMatcherData: {
          value: '@split'
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
    email: '@split'
  });

  assert.equal(typeof evaluator, 'function', 'evaluator should be callable');
  assert.equal(evaluation.treatment, 'on', "evaluator should return treatment 'on'");
  assert.equal(evaluation.label, label, "evaluator should return label ''");
  assert.end();
});

tape('PARSER / if user.email does not contain "@split" then not match', async function (assert) {
  const label = 'email contains [@split]';
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
        unaryStringMatcherData: {
          value: '@split'
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
