'use strict';

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
var splitio = require('../../');
var tape = require('tape');

tape('SDK / check the event SDK_READY is fired', {
  timeout: 5000
}, function (assert) {
  var prod = splitio({
    core: {
      authorizationKey: 'kn4j3ctq14ipifmjvbbqu8dgt6'
    },
    urls: {
      sdk: 'https://sdk-staging.split.io/api',
      events: 'https://events-staging.split.io/api'
    }
  });

  assert.plan(1);
  prod.on(prod.Event.SDK_READY, function () {
    prod.destroy();
    assert.pass('ready event fired');
  });
});