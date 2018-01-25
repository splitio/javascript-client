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

import tape from 'tape-catch';
import Treatments from '../../treatments';

tape('TREATMENTS / parse 2 treatments', assert => {
  let t = Treatments.parse([{
    treatment: 'on',
    size: 5
  }, {
    treatment: 'control',
    size: 95
  }]);

  assert.deepEqual(t._ranges, [5, 100]);
  assert.deepEqual(t._treatments, ['on', 'control']);
  assert.end();
});

tape('TREATMENTS / parse 1 treatment 100%:on', assert => {
  let t = Treatments.parse([{
    treatment: 'on',
    size: 100
  }]);

  assert.deepEqual(t._ranges, [100]);
  assert.deepEqual(t._treatments, ['on']);
  assert.end();
});

tape('TREATMENTS / parse 1 treatment 100%:off', assert => {
  let t = Treatments.parse([{
    treatment: 'control',
    size: 100
  }]);

  assert.deepEqual(t._ranges, [100]);
  assert.deepEqual(t._treatments, ['control']);
  assert.end();
});

tape('TREATMENTS / given a 50%:visa 50%:mastercard we should evaluate correctly', assert => {
  let t = Treatments.parse([{
    treatment: 'visa',
    size: 50
  },{
    treatment: 'mastercard',
    size: 50
  }]);

  assert.equal(t.getTreatmentFor(10), 'visa', '10 => visa');
  assert.equal(t.getTreatmentFor(50), 'visa', '50 => visa');
  assert.equal(t.getTreatmentFor(51), 'mastercard', '51 => mastercard');
  assert.equal(t.getTreatmentFor(100), 'mastercard', '100 => mastercard');
  assert.end();
});