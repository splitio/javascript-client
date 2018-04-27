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
import validate from '../../manager/validate';

tape('MANAGER SPLIT VALIDATE / if null is passed a param should return false', assert => {
  const isValidSplitName = validate(null);

  assert.true(isValidSplitName === false, 'manager validate will be false if null is passed as a param');
  
  assert.end();
});

tape('MANAGER SPLIT VALIDATE / if undefined is passed a param should return false', assert => {
  const isValidSplitName = validate(undefined);

  assert.true(isValidSplitName === false, 'manager validate will be false if undefined is passed as a param');
  
  assert.end();
});

tape('MANAGER SPLIT VALIDATE / if not a string is passed a param should return false', assert => {
  const isValidSplitName = validate(12345);

  assert.true(isValidSplitName === false, 'manager validate will be false if not a string is passed as a param');
  
  assert.end();
});

tape('MANAGER SPLIT VALIDATE / if a string is passed a param should return true', assert => {
  const isValidSplitName = validate('some_split_name');

  assert.true(isValidSplitName, 'manager validate will be true if a valid string is passed as a param');
  
  assert.end();
});