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

tape('PARSER / if user is in segment ["u1", "u2", "u3", "u4"] then split 100%:on', assert => {

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

tape('PARSER / if user.account is in list ["v1", "v2", "v3"] then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "account"
        },
        "matcherType": "WHITELIST",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": {
          "whitelist": [
            "v1",
            "v2",
            "v3"
          ]
        },
        "unaryNumericMatcherData": null,
        "betweenMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    account: 'v1'
  }) === 'on', 'v1 is defined in the whitelist');

  assert.true(evaluator('v1', 31) === undefined, 'we are looking for v1 inside the account attribute');

  assert.true(evaluator('test@split.io', 31, {
    account: 'v4'
  }) === undefined, 'v4 is not defined inside the whitelist');

  assert.end();

});

tape('PARSER / if user.account is in segment all then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "account"
        },
        "matcherType": "ALL_KEYS",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null,
        "unaryNumericMatcherData": null,
        "betweenMatcherData": null,
        "unaryStringMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    account: 'v1'
  }) === 'on', 'v1 is defined in segment all');

  assert.true(
    evaluator('test@split.io', 31) === undefined,
    "missing attribute account ends in undefined result"
  );

  assert.end();
});

tape('PARSER / if user.attr is between 10 and 20 then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "attr"
        },
        "matcherType": "BETWEEN",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null,
        "unaryNumericMatcherData": null,
        "betweenMatcherData": {
          "dataType": "NUMBER",
          "start": 10,
          "end": 20
        }
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    attr: 10
  }) === 'on', '10 is between 10 and 20');

  assert.true(evaluator('test@split.io', 31, {
    attr: 9
  }) === undefined, '9 is not between 10 and 20');

  assert.true(
    evaluator('test@split.io', 31) === undefined,
    'undefined is not between 10 and 20'
  );

  assert.end();
});

tape('PARSER / if user.attr <= datetime 1458240947021 then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "attr"
        },
        "matcherType": "LESS_THAN_OR_EQUAL_TO",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null,
        "unaryNumericMatcherData": {
          "dataType": "DATETIME",
          "value": 1458240947021
        },
        "betweenMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947021
  }) === 'on', '1458240947021 is equal');

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947020
  }) === 'on', '1458240947020 is less than 1458240947021');

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947022
  }) === undefined, '1458240947022 is not less than 1458240947021');

  assert.true(
    evaluator('test@split.io', 31) === undefined,
    'undefined is not less than 1458240947021'
  );

  assert.end();
});

tape('PARSER / if user.attr >= datetime 1458240947021 then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "attr"
        },
        "matcherType": "GREATER_THAN_OR_EQUAL_TO",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null,
        "unaryNumericMatcherData": {
          "dataType": "DATETIME",
          "value": 1458240947021
        },
        "betweenMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947021
  }) === 'on', '1458240947021 is equal');

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947020
  }) === undefined, '1458240947020 is less than 1458240947021');

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947022
  }) === 'on', '1458240947022 is greater than 1458240947021');

  assert.true(
    evaluator('test@split.io', 31) === undefined,
    'undefined is not greater than 1458240947021'
  );

  assert.end();
});

tape('PARSER / if user.attr = datetime 1458240947021 then split 100:on', assert => {

  let {evaluator, segments} = parser([{
    "matcherGroup": {
      "combiner": "AND",
      "matchers": [{
        "keySelector": {
          "trafficType": "user",
          "attribute": "attr"
        },
        "matcherType": "EQUAL_TO",
        "negate": false,
        "userDefinedSegmentMatcherData": null,
        "whitelistMatcherData": null,
        "unaryNumericMatcherData": {
          "dataType": "DATETIME",
          "value": 1458240947021
        },
        "betweenMatcherData": null
      }]
    },
    "partitions": [{
      "treatment": "on",
      "size": 100
    }]
  }]);

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947021
  }) === 'on', '1458240947021 is equal');

  assert.true(evaluator('test@split.io', 31, {
    attr: 1458240947020
  }) === undefined, '1458240947020 is not equal to 1458240947021');

  assert.true(
    evaluator('test@split.io', 31) === undefined,
    'undefined is not equal to 1458240947021'
  );

  assert.end();
});
