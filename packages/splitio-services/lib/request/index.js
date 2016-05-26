'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

require('isomorphic-fetch');

var settings = require('@splitsoftware/splitio-utils/lib/settings');

var requestOptions = require('./options');

function RequestFactory(relativeUrl, params) {
  var apiToken = settings.get('authorizationKey');
  var sdkVersion = settings.get('version');

  return new Request(settings.url(relativeUrl), (0, _assign2.default)({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiToken,
      'SplitSDKVersion': '' + sdkVersion,
      'Connection': 'keep-alive' // node-fetch requires this to correctly support keep-alive connections
    },
    compress: true
  }, requestOptions, params));
}

module.exports = RequestFactory;