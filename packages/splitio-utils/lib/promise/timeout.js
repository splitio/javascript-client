'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

function timeout(ms, promise) {
  return new _promise2.default(function (resolve, reject) {
    var tid = setTimeout(function () {
      reject('timeout');
    }, ms);

    promise.then(function (res) {
      clearTimeout(tid);
      resolve(res);
    }, function (err) {
      clearTimeout(tid);
      reject(err);
    });
  });
}

module.exports = timeout;