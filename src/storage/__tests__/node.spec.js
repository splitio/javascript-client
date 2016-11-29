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

// @flow

'use strict';

const tape = require('tape');
const Redis = require('ioredis');

const {
  AsyncSetSuite,
  AsyncMapSuite
} = require('./suite');

const AsyncSetMemory = require('../set/AsyncSetMemory');
const AsyncSetRedis = require('../set/AsyncSetRedis');

const AsyncMapMemory = require('../map/AsyncMapMemory');
const AsyncMapRedis = require('../map/AsyncMapRedis');

// Redis instance
const SET_NAME = 'UniqueSetName';

const connection = new Redis(32771, 'localhost', {
  dropBufferSupport: true
});

const qgen = (function* quit() {
  yield;
  connection.quit();
})();

const asyncSetRedis = new AsyncSetRedis(connection, SET_NAME);
const asyncMapRedis = new AsyncMapRedis(connection);

// Memory instance
const asyncSetMemory = new AsyncSetMemory();
const asyncMapMemory = new AsyncMapMemory();

AsyncSetSuite(asyncSetMemory);
AsyncMapSuite(asyncMapMemory);

AsyncSetSuite(asyncSetRedis).on('end', () => qgen.next());
AsyncMapSuite(asyncMapRedis).on('end', () => qgen.next());
