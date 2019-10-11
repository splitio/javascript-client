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
import { evaluateFeatures } from '../../evaluator';
import * as LabelsConstants from '../../../utils/labels';

const splitsMock = {
  regular: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on","seed":1684183541,"configurations":{},"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  config: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on","seed":1684183541,"configurations":{"on":"{color:\'black\'}"},"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  killed: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on2","seed":1684183541,"configurations":{},"status":"ACTIVE","killed":true,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  archived: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on3","seed":1684183541,"configurations":{},"status":"ARCHIVED","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  trafficAlocation1: '{"changeNumber":1487277320548,"trafficAllocationSeed":-1667452163,"trafficAllocation":1,"trafficTypeName":"user","name":"always-on4","seed":1684183541,"configurations":{},"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  killedWithConfig: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on5","seed":1684183541,"configurations":{"off":"{color:\'black\'}"},"status":"ACTIVE","killed":true,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  archivedWithConfig: '{"changeNumber":1487277320548,"trafficAllocationSeed":1667452163,"trafficAllocation":100,"trafficTypeName":"user","name":"always-on5","seed":1684183541,"configurations":{"off":"{color:\'black\'}"},"status":"ARCHIVED","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}',
  trafficAlocation1WithConfig: '{"changeNumber":1487277320548,"trafficAllocationSeed":-1667452163,"trafficAllocation":1,"trafficTypeName":"user","name":"always-on6","seed":1684183541,"configurations":{"off":"{color:\'black\'}"},"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"conditionType":"ROLLOUT","matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}'
};

const mockStorage = {
  splits: {
    getSplit(name) {
      if (name === 'throw_exception') throw new Error('Error');
      if (splitsMock[name]) return splitsMock[name];

      return null;
    },
    fetchMany(names) {
      const splits = new Map;
      names.forEach(name => {
        splits.set(name, this.getSplit(name));
      });
      
      return splits;
    }
  }
};

tape('EVALUATOR - Multiple evaluations at once  / should return label exception, treatment control and config null on error', async function (assert) {
  const expectedOutput = {
    throw_exception: {
      treatment: 'control',
      label: LabelsConstants.EXCEPTION,
      config: null
    }
  };

  const evaluationPromise = evaluateFeatures(
    'fake-key',
    ['throw_exception'],
    null,
    mockStorage
  );

  // This validation is async because the only exception possible when retrieving a Split would happen with Async storages.
  const evaluation = await evaluationPromise;

  assert.deepEqual(evaluation, expectedOutput, 'If there was an error on the fetchMany we should get the results for exception.');

  assert.end();
});


tape('EVALUATOR - Multiple evaluations at once / should return right labels, treatments and configs if storage returns without errors.', async function (assert) {
  const expectedOutput = {
    config: {
      treatment: 'on', label: 'in segment all',
      config: '{color:\'black\'}', changeNumber: 1487277320548
    },
    not_existent_split: {
      treatment: 'control', label: LabelsConstants.SPLIT_NOT_FOUND, config: null
    },
  };

  const multipleEvaluationAtOnce = await evaluateFeatures(
    'fake-key',
    ['config', 'not_existent_split', 'regular', 'killed', 'archived', 'trafficAlocation1', 'killedWithConfig', 'archivedWithConfig', 'trafficAlocation1WithConfig'],
    null,
    mockStorage
  );
  // assert evaluationWithConfig
  assert.deepEqual(multipleEvaluationAtOnce['config'], expectedOutput['config'], 'If the split is retrieved successfully we should get the right evaluation result, label and config.');
  // assert evaluationNotFound
  assert.deepEqual(multipleEvaluationAtOnce['not_existent_split'], expectedOutput['not_existent_split'], 'If the split is not retrieved successfully because it does not exist, we should get the right evaluation result, label and config.');
  // assert regular
  assert.deepEqual(multipleEvaluationAtOnce['regular'], { ...expectedOutput['config'], config: null }, 'If the split is retrieved successfully we should get the right evaluation result, label and config. If Split has no config it should have config equal null.');
  // assert killed
  assert.deepEqual(multipleEvaluationAtOnce['killed'],
    { ...expectedOutput['config'], treatment: 'off', config: null, label: LabelsConstants.SPLIT_KILLED },
    'If the split is retrieved but is killed, we should get the right evaluation result, label and config.'
  );
  // assert archived
  assert.deepEqual(multipleEvaluationAtOnce['archived'],
    { ...expectedOutput['config'], treatment: 'control', label: LabelsConstants.SPLIT_ARCHIVED, config: null },
    'If the split is retrieved but is archived, we should get the right evaluation result, label and config.'
  );
  // assert trafficAllocation1
  assert.deepEqual(multipleEvaluationAtOnce['trafficAlocation1'],
    { ...expectedOutput['config'], label: LabelsConstants.NOT_IN_SPLIT, config: null, treatment: 'off' },
    'If the split is retrieved but is not in split (out of Traffic Allocation), we should get the right evaluation result, label and config.'
  );
  // assert killedWithConfig
  assert.deepEqual(multipleEvaluationAtOnce['killedWithConfig'],
    { ...expectedOutput['config'], treatment: 'off', label: LabelsConstants.SPLIT_KILLED },
    'If the split is retrieved but is killed, we should get the right evaluation result, label and config.'
  );
  // assert archivedWithConfig
  assert.deepEqual(multipleEvaluationAtOnce['archivedWithConfig'],
    { ...expectedOutput['config'], treatment: 'control', label: LabelsConstants.SPLIT_ARCHIVED, config: null },
    'If the split is retrieved but is archived, we should get the right evaluation result, label and config.'
  );
  // assert trafficAlocation1WithConfig
  assert.deepEqual(multipleEvaluationAtOnce['trafficAlocation1WithConfig'],
    { ...expectedOutput['config'], label: LabelsConstants.NOT_IN_SPLIT, treatment: 'off' },
    'If the split is retrieved but is not in split (out of Traffic Allocation), we should get the right evaluation result, label and config.'
  );

  assert.end();
});
