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

const tape = require('tape-catch');
const matcherTypes = require('../../matchers/types');
const matcherFactory = require('../../matchers');

tape('MATCHER WHITELIST / should return true ONLY when the key is defined', function (assert) {

  let matcher = matcherFactory({
    type: matcherTypes.enum.WHITELIST,
    value: new Set().add('key')
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another key'), '"another key" should be false');
  assert.end();

});
