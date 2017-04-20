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
const matcherTypes = require('../../matchers/types').enum;
const matcherFactory = require('../../matchers');

tape('MATCHER PART_OF_SET / should return true ONLY when value is part of of set ["update", "add", "delete"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.PART_OF_SET,
    value: ['update', 'add', 'delete']
  });

  assert.true(matcher(['update', 'add']),           '["update", "add"] is part of of set ["update", "add", "delete"]');
  assert.true(matcher(['add', 'update']),           '["add", "update"] is part of of set ["update", "add", "delete"]');
  assert.true(matcher(['update', 'add', 'delete']), '["update", "add", "delete"] is part of of set ["update", "add", "delete"]');
  assert.true(matcher(['update']),                  '["update"] is part of set ["update", "add", "delete"]');
  assert.false(matcher(['add', 'create']),          '["add", "create"] is not part of set ["update", "add", "delete"]');
  assert.false(matcher(['write']),                  '["add"] is not part of set ["update", "add", "delete"]');
  assert.end();

});
