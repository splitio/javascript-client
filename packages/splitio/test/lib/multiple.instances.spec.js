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
var splitio = require('../../');
var tape = require('tape');

var prod = splitio({
  core: {
    authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
  }
});

var stage = splitio({
  core: {
    authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
  }
});

// wait till both instances are ready.
_promise2.default.all([prod.ready(), stage.ready()]).then(function () {
  tape('SDK / evaluates a feature in prod sdk instance', function (assert) {
    assert.equal(prod.getTreatment('node', 'get_environment', {
      env: 'prod'
    }), 'prod', 'Feature get_environment should return the treatment prod');
    assert.end();
  });

  tape('SDK / evaluates a feature in stage sdk instance', function (assert) {
    assert.equal(stage.getTreatment('node', 'get_environment', {
      env: 'stage'
    }), 'stage', 'Feature get_environment should return the treatment stage');
    assert.end();
  });

  tape('SDK / evaluates a feature in both sdks', function (assert) {
    var prodTreatment = prod.getTreatment('node', 'get_environment', {
      env: 'qc'
    });
    var stageTreatment = stage.getTreatment('node', 'get_environment', {
      env: 'qc'
    });

    assert.equal(prodTreatment, stageTreatment, 'Feature get_environment should return the same treatment for both sdks');
    assert.end();
  });

  tape.onFinish(function () {
    prod.destroy();
    stage.destroy();
  });
});