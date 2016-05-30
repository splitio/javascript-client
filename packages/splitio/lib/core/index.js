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

var scheduler = require('../scheduler');

var _isStarted = false;

var core = {
  start: function start(settings) {
    if (!_isStarted) {
      _isStarted = true;
    } else {
      return _promise2.default.reject('Engine already started');
    }

    return scheduler(settings);
  },
  isStared: function isStared() {
    return _isStarted;
  }
};

module.exports = core;