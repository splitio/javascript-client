'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var tape = require('tape');
var collectorFactory = require('../../../lib/collector/sequential');

tape('SEQUENTIAL COLLECTOR / should incrementally store values', function (assert) {
  var c = collectorFactory();

  c.track(0);
  c.track(1);
  c.track(2);

  assert.true(c.state().reduce(function (accum, e, k) {
    return accum += e - k;
  }, 0) === 0, 'all the items should be stored in sequential order');
  assert.end();
});

tape('SEQUENTIAL COLLECTOR / should support custom toJSON method', function (assert) {
  var c = collectorFactory();
  var hooked = (0, _stringify2.default)(c);
  var manual = (0, _stringify2.default)(c.state());

  assert.true(hooked === manual, 'toJSON should expose the counters as an array of numbers');
  assert.end();
});