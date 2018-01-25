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

/*eslint-disable camelcase*/

import tape from 'tape-catch';

import { types as matcherTypes } from '../../matchers/types';
import matcherFactory from '../../matchers';
import splitEvaluator from '../../evaluator';

const ALWAYS_ON_SPLIT = '{"trafficTypeName":"user","name":"always-on","trafficAllocation":100,"trafficAllocationSeed":1012950810,"seed":-725161385,"status":"ACTIVE","killed":false,"defaultTreatment":"off","changeNumber":1494364996459,"algo":2,"conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":null},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":null,"whitelistMatcherData":null,"unaryNumericMatcherData":null,"betweenMatcherData":null}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}';
const ALWAYS_OFF_SPLIT = '{"trafficTypeName":"user","name":"always-off","trafficAllocation":100,"trafficAllocationSeed":-331690370,"seed":403891040,"status":"ACTIVE","killed":false,"defaultTreatment":"on","changeNumber":1494365020316,"algo":2,"conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":null},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":null,"whitelistMatcherData":null,"unaryNumericMatcherData":null,"betweenMatcherData":null}]},"partitions":[{"treatment":"on","size":0},{"treatment":"off","size":100}],"label":"in segment all"}]}';

const STORED_SPLITS = new Map();
STORED_SPLITS.set('always-on', ALWAYS_ON_SPLIT);
STORED_SPLITS.set('always-off', ALWAYS_OFF_SPLIT);

const mockStorage = {
  splits: {
    getSplit: name => STORED_SPLITS.get(name)
  }
};

tape('MATCHER IN_SPLIT_TREATMENT / should return true ONLY when parent split returns one of the expected treatments', function (assert) {
  const matcherTrue_alwaysOn = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-on',
      treatments: ['not-existing','on','other'] // We should match from a list of treatments
    }
  }, mockStorage);

  const matcherFalse_alwaysOn = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-on',
      treatments: ['off', 'v1']
    }
  }, mockStorage);

  const matcherTrue_alwaysOff = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-off',
      treatments: ['not-existing','off']
    }
  }, mockStorage);

  const matcherFalse_alwaysOff = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-off',
      treatments: ['v1', 'on']
    }
  }, mockStorage);

  assert.true(matcherTrue_alwaysOn({ key: 'a-key' }, splitEvaluator), 'Parent split returns one of the expected treatments, so the matcher returns true');
  assert.false(matcherFalse_alwaysOn({ key: 'a-key' }, splitEvaluator), 'Parent split returns treatment "on", but we are expecting ["off", "v1"], so the matcher returns false');
  assert.true(matcherTrue_alwaysOff({ key: 'a-key' }, splitEvaluator), 'Parent split returns one of the expected treatments, so the matcher returns true');
  assert.false(matcherFalse_alwaysOff({ key: 'a-key' }, splitEvaluator), 'Parent split returns treatment "on", but we are expecting ["off", "v1"], so the matcher returns false');

  assert.end();
});

tape('MATCHER IN_SPLIT_TREATMENT / Edge cases', function (assert) {
  const matcherParentNotExist = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'not-existent-split',
      treatments: ['on','off']
    }
  }, mockStorage);

  const matcherNoTreatmentsExpected = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-on',
      treatments: []
    }
  }, mockStorage);

  const matcherParentNameEmpty = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: '',
      treatments: []
    }
  }, mockStorage);

  const matcherParentNameWrongType = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: { some: 44 },
      treatments: []
    }
  }, mockStorage);

  const matcherExpectedTreatmentWrongType_matching = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-on',
      treatments: [null, [1,2], 3, {}, true, 'on']
    }
  }, mockStorage);

  const matcherExpectedTreatmentWrongType_notMatching = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-off',
      treatments: [null, [1,2], 3, {}, true, 'on']
    }
  }, mockStorage);

  const matcherExpectationsListWrongType = matcherFactory({
    type: matcherTypes.IN_SPLIT_TREATMENT,
    value: {
      split: 'always-on',
      treatments: 658
    }
  }, mockStorage);

  assert.false(matcherParentNotExist({ key: 'a-key' }, splitEvaluator), 'If the parent split does not exist, matcher should return false');
  assert.false(matcherNoTreatmentsExpected({ key: 'a-key' }, splitEvaluator), 'If treatments expectation list is empty, matcher should return false (no treatment will match)');
  assert.false(matcherParentNameEmpty({ key: 'a-key' }, splitEvaluator), 'If the parent split name is empty, matcher should return false');
  assert.false(matcherParentNameWrongType({ key: 'a-key' }, splitEvaluator), 'If the parent split name is not a string, matcher should return false');
  assert.true(matcherExpectedTreatmentWrongType_matching({ key: 'a-key' }, splitEvaluator), 'If treatments expectation list has elements of the wrong type, those elements are overlooked.');
  assert.false(matcherExpectedTreatmentWrongType_notMatching({ key: 'a-key' }, splitEvaluator), 'If treatments expectation list has elements of the wrong type, those elements are overlooked.');
  assert.false(matcherExpectationsListWrongType({ key: 'a-key' }, splitEvaluator), 'If treatments expectation list has wrong type, matcher should return false');

  assert.end();
});
