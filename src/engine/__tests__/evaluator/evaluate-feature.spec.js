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
import { evaluateFeature } from '../../evaluator';
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
    }
  }
};

tape('EVALUATOR / should return label exception, treatment control and config null on error', async function (assert) {
  const expectedOutput = {
    treatment: 'control',
    label: LabelsConstants.EXCEPTION,
    config: null
  };
  const evaluationPromise = evaluateFeature(
    'fake-key',
    'throw_exception',
    null,
    mockStorage
  );

  // This validation is async because the only exception possible when retrieving a Split would happen with Async storages.
  const evaluation = await evaluationPromise;

  assert.deepEqual(evaluation, expectedOutput, 'If there was an error on the getSplits we should get the results for exception.');

  assert.end();
});


tape('EVALUATOR / should return right label, treatment and config if storage returns without errors.', async function (assert) {
  const expectedOutput = {
    treatment: 'on', label: 'in segment all',
    config: '{color:\'black\'}', changeNumber: 1487277320548
  };
  const expectedOutputControl = {
    treatment: 'control', label: LabelsConstants.SPLIT_NOT_FOUND, config: null
  };

  const evaluationWithConfig = evaluateFeature(
    'fake-key',
    'config',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationWithConfig, expectedOutput, 'If the split is retrieved successfully we should get the right evaluation result, label and config.');

  const evaluationNotFound = evaluateFeature(
    'fake-key',
    'not_existent_split',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationNotFound, expectedOutputControl, 'If the split is not retrieved successfully because it does not exist, we should get the right evaluation result, label and config.');

  const evaluation = evaluateFeature(
    'fake-key',
    'regular',
    null,
    mockStorage
  );
  assert.deepEqual(evaluation, { ...expectedOutput, config: null }, 'If the split is retrieved successfully we should get the right evaluation result, label and config. If Split has no config it should have config equal null.');

  const evaluationKilled = evaluateFeature(
    'fake-key',
    'killed',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationKilled,
    { ...expectedOutput, treatment: 'off', config: null, label: LabelsConstants.SPLIT_KILLED },
    'If the split is retrieved but is killed, we should get the right evaluation result, label and config.'
  );

  const evaluationArchived = evaluateFeature(
    'fake-key',
    'archived',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationArchived,
    { ...expectedOutput, treatment: 'control', label: LabelsConstants.SPLIT_ARCHIVED, config: null },
    'If the split is retrieved but is archived, we should get the right evaluation result, label and config.'
  );

  const evaluationtrafficAlocation1 = evaluateFeature(
    'fake-key',
    'trafficAlocation1',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationtrafficAlocation1,
    { ...expectedOutput, label: LabelsConstants.NOT_IN_SPLIT, config: null, treatment: 'off' },
    'If the split is retrieved but is not in split (out of Traffic Allocation), we should get the right evaluation result, label and config.'
  );

  const evaluationKilledWithConfig = evaluateFeature(
    'fake-key',
    'killedWithConfig',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationKilledWithConfig,
    { ...expectedOutput, treatment: 'off', label: LabelsConstants.SPLIT_KILLED },
    'If the split is retrieved but is killed, we should get the right evaluation result, label and config.'
  );

  const evaluationArchivedWithConfig = evaluateFeature(
    'fake-key',
    'archivedWithConfig',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationArchivedWithConfig,
    { ...expectedOutput, treatment: 'control', label: LabelsConstants.SPLIT_ARCHIVED, config: null },
    'If the split is retrieved but is archived, we should get the right evaluation result, label and config.'
  );

  const evaluationtrafficAlocation1WithConfig = evaluateFeature(
    'fake-key',
    'trafficAlocation1WithConfig',
    null,
    mockStorage
  );
  assert.deepEqual(evaluationtrafficAlocation1WithConfig,
    { ...expectedOutput, label: LabelsConstants.NOT_IN_SPLIT, treatment: 'off' },
    'If the split is retrieved but is not in split (out of Traffic Allocation), we should get the right evaluation result, label and config.'
  );


  assert.end();
});
