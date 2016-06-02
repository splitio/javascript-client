'use strict';

var _isFinite = require('babel-runtime/core-js/number/is-finite');

var _isFinite2 = _interopRequireDefault(_isFinite);

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
var now = require('../../../lib/now');

tape('NOW / should generate a value each time you call it', function (assert) {
  var n1 = now();
  var n2 = now();
  var n3 = now();

  assert.true((0, _isFinite2.default)(n1), 'is a finite value?');
  assert.true((0, _isFinite2.default)(n2), 'is a finite value?');
  assert.true((0, _isFinite2.default)(n3), 'is a finite value?');
  assert.end();
});