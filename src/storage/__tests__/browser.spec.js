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

const {
  AsyncSetSuite,
  AsyncMapSuite
} = require('./suite');

const AsyncSetMemory = require('../set/AsyncSetMemory');
const AsyncSetLocalStorage = require('../set/AsyncSetLocalStorage');

const AsyncMapMemory = require('../map/AsyncMapMemory');
const AsyncMapLocalStorage = require('../map/AsyncMapLocalStorage');

const SET_NAME = 'UniqueSetName';

// LocalStorage instances
const asyncSetLocalStorage = new AsyncSetLocalStorage(SET_NAME);
const asyncMapLocalStorage = new AsyncMapLocalStorage();

// Memory instance
const asyncSetMemory = new AsyncSetMemory();
const asyncMapMemory = new AsyncMapMemory();

AsyncSetSuite(asyncSetLocalStorage);
AsyncSetSuite(asyncSetMemory);

AsyncMapSuite(asyncMapLocalStorage);
AsyncMapSuite(asyncMapMemory);
