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

require('isomorphic-fetch');

const baseline = require('./options');

function RequestFactory(settings, relativeUrl, params) {
  const token = settings.core.authorizationKey;
  const version = settings.version;

  return new Request(settings.url(relativeUrl), Object.assign({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'SplitSDKVersion': `${version}`,
      // node-fetch requires this to correctly support keep-alive connections
      'Connection': 'keep-alive'
    },
    compress: true
  }, baseline, params));
}

module.exports = RequestFactory;
