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
import { types as matcherTypes } from '../../matchers/types';
import matcherFactory from '../../matchers';

tape('MATCHER CONTAINS_ALL_OF_SET / should return true ONLY when value contains all of set ["update", "add"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.CONTAINS_ALL_OF_SET,
    value: ['update', 'add']
  });

  assert.true(matcher(['update', 'add']),           '["update", "add"] contains all of set ["update", "add"]');
  assert.true(matcher(['update', 'add', 'delete']), '["update", "add", "delete"] contains all of set ["update", "add"]');
  assert.false(matcher(['update']),                 '["update"] does not contain all of set ["update", "add"]');
  assert.false(matcher(['add', 'create']),          '["add", "create"] does not contain all of set ["update", "add"]');
  assert.false(matcher(['add']),                    '["add"] does not contain all of set ["update", "add"]');
  assert.end();

});
