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

const ava = require('ava');
const now = require('../../now');

ava('NOW / should generate a value each time you call it', assert => {
  let n1 = now();
  let n2 = now();
  let n3 = now();

  assert.true(Number.isFinite(n1), 'is a finite value?');
  assert.true(Number.isFinite(n2), 'is a finite value?');
  assert.true(Number.isFinite(n3), 'is a finite value?');
  assert.end();
});
