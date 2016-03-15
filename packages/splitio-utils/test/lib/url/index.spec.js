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

var tape = require('tape');
var url = require('../../../lib/url');

tape('URL / check development url', function (assert) {
  process.env.NODE_ENV = 'development';
  assert.equal(url('/test'), 'http://localhost:8081/api/test');
  assert.end();
});

tape('URL / check stage url', function (assert) {
  process.env.NODE_ENV = 'stage';
  assert.equal(url('/test'), 'https://sdk-staging.split.io/api/test');
  assert.end();
});

tape('URL / check production url', function (assert) {
  process.env.NODE_ENV = 'production';
  assert.equal(url('/test'), 'https://sdk.split.io/api/test');
  assert.end();
});

tape('URL / check loadtesting url', function (assert) {
  process.env.NODE_ENV = 'loadtesting';
  assert.equal(url('/test'), 'https://sdk-loadtesting.split.io/api/test');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map