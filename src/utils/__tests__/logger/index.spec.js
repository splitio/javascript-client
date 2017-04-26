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

const splitLogger = require('../../logger');

tape('SPLIT LOGGER / methods', assert => {

  assert.equal(typeof splitLogger, 'function', 'Importing the module should return a function.');

  assert.equal(typeof splitLogger.API, 'object', 'Our logger should expose an API object.');
  assert.equal(typeof splitLogger.API.enable, 'function', 'API object should have enable method.');
  assert.equal(typeof splitLogger.API.disable, 'function', 'API object should have disable method.');

  assert.end();
});
