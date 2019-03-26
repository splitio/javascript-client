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
import evaluator from '../../evaluator';
import LabelsConstants from '../../../utils/labels';

const mockErrorStorage = {
  splits: {
    getSplit() {
      throw 'Error';
    }
  }
};
const mockWorkingStorage = {
  splits: {
    getSplit(name) {
      if (name === 'not_existent_split') return null;

      return '{"changeNumber":1487277320548,"trafficTypeName":"user","name":"always-on","seed":1684183541,"configurations":{"on":"{color:\'black\'}"},"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}';
    }
  }
};
const mockWorkingStorageWithoutConfig = {
  splits: {
    getSplit() {
      return '{"changeNumber":1487277320548,"trafficTypeName":"user","name":"always-on","seed":1684183541,"status":"ACTIVE","killed":false,"defaultTreatment":"off","conditions":[{"matcherGroup":{"combiner":"AND","matchers":[{"keySelector":{"trafficType":"user","attribute":""},"matcherType":"ALL_KEYS","negate":false,"userDefinedSegmentMatcherData":{"segmentName":""},"unaryNumericMatcherData":{"dataType":"","value":0},"whitelistMatcherData":{"whitelist":null},"betweenMatcherData":{"dataType":"","start":0,"end":0}}]},"partitions":[{"treatment":"on","size":100},{"treatment":"off","size":0}],"label":"in segment all"}]}';
    }
  }
};

tape('EVALUATOR / should return label exception, treatment control and config null on error', async function (assert) {
  const expectedOutput = {
    treatment: 'control',
    label: LabelsConstants.EXCEPTION,
    config: null
  };
  const evaluationPromise = evaluator(
    'fake-key',
    'split-name',
    null,
    mockErrorStorage
  );

  const evaluation = await evaluationPromise;

  assert.deepEqual(evaluation, expectedOutput, 'If there was an error on the getSplits we should get the results for exception.');

  assert.end();
});


tape('EVALUATOR / should return right label, treatment and config if storage returns without errors.', async function (assert) {
  const expectedOutput = {
    treatment: 'on', label: 'in segment all',
    config: '{color:\'black\'}', changeNumber: 1487277320548
  };
  const expectedOutputNotFound = {
    treatment: 'control', label: 'definition not found', config: null
  };
  const evaluationPromise = evaluator(
    'fake-key',
    'split-name',
    null,
    mockWorkingStorage
  );
  const evaluation = await evaluationPromise;

  assert.deepEqual(evaluation, expectedOutput, 'If the split is retrieved successfully we should get the right evaluation result, label and config.');

  const evaluationPromise2 = evaluator(
    'fake-key',
    'not_existent_split',
    null,
    mockWorkingStorage
  );

  assert.deepEqual(evaluationPromise2, expectedOutputNotFound, 'If the split is not retrieved successfully because it does not exist, we should get the right evaluation result, label and config.');

  const evaluationPromiseWithoutConfig = evaluator(
    'fake-key',
    'split-name',
    null,
    mockWorkingStorageWithoutConfig
  );

  const evaluationWithoutConfig = await evaluationPromiseWithoutConfig;

  assert.deepEqual(evaluationWithoutConfig, { ...expectedOutput, config: null }, 'If the split is retrieved successfully we should get the right evaluation result, label and config. If Split has no config it should have config equal null.');

  assert.end();
});
