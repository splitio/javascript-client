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
import evaluator from '../../evaluator';
import LabelsConstants from '../../../utils/labels';

const mockErrorStorage = {
  splits: {
    getSplit() {
      throw 'Error';
    }
  }
};

const mockStorage = {
  splits: {
    getSplit() {
      return 'split_name';
    }
  }
};

const expectedOutput = {
  treatment: 'control',
  label: LabelsConstants.EXCEPTION
};

tape('EVALUATOR / should return label exception and treatment control on error', async function (assert) {
  const evaluationPromise = evaluator(
    'fake-key',
    'split-name',
    null,
    mockErrorStorage
  );

  const evaluation = await evaluationPromise;

  assert.equal(evaluation.treatment, expectedOutput.treatment);
  assert.equal(evaluation.label, expectedOutput.label);
  
  assert.end();
});

tape('EVALUATOR / should return label exception and treatment control on error if split name is null', async function (assert) {
  const evaluationPromise = evaluator(
    'fake-key',
    null,
    null,
    mockStorage
  );

  const evaluation = await evaluationPromise;

  assert.equal(evaluation.treatment, expectedOutput.treatment);
  assert.equal(evaluation.label, expectedOutput.label);
  
  assert.end();
});

tape('EVALUATOR / should return label exception and treatment control on error if split name is undefined', async function (assert) {
  const evaluationPromise = evaluator(
    'fake-key',
    undefined,
    null,
    mockStorage
  );

  const evaluation = await evaluationPromise;

  assert.equal(evaluation.treatment, expectedOutput.treatment);
  assert.equal(evaluation.label, expectedOutput.label);
  
  assert.end();
});

tape('EVALUATOR / should return label exception and treatment control on error if split name is not a string', async function (assert) {
  const evaluationPromise = evaluator(
    'fake-key',
    12345,
    null,
    mockStorage
  );

  const evaluation = await evaluationPromise;

  assert.equal(evaluation.treatment, expectedOutput.treatment);
  assert.equal(evaluation.label, expectedOutput.label);
  
  assert.end();
});