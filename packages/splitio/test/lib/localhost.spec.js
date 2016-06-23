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

tape('SDK / evaluates a feature in offline mode', function (assert) {
  // Look for configurations into $HOME/.split file
  var sdk = splitio({
    core: {
      authorizationKey: 'localhost'
    }
  });

  sdk.on(sdk.Event.SDK_READY, function () {
    assert.equal(sdk.getTreatment('dev', 'my_new_feature'), 'on', 'should evaluates to on');
    assert.equal(sdk.getTreatment('dev', 'unknown_feature'), 'control', 'should evaluates to control');

    sdk.destroy();
    assert.end();
  });
});

tape('SDK / allow multiple instances when running offline (not too much sense)', function (assert) {
  // Look for configurations into $HOME/.split file
  var sdk1 = splitio({
    core: {
      authorizationKey: 'localhost'
    }
  });
  var sdk2 = splitio({
    core: {
      authorizationKey: 'localhost'
    }
  });

  _promise2.default.all([sdk1.ready(), sdk2.ready()]).then(function () {
    assert.equal(sdk1.getTreatment('dev', 'my_new_feature'), 'on', 'should evaluates to on');
    assert.equal(sdk1.getTreatment('dev', 'unknown_feature'), 'control', 'should evaluates to control');

    assert.equal(sdk2.getTreatment('dev', 'my_new_feature'), 'on', 'should evaluates to on');
    assert.equal(sdk2.getTreatment('dev', 'unknown_feature'), 'control', 'should evaluates to control');

    sdk1.destroy();
    sdk2.destroy();

    assert.end();
  }).catch(function (err) {
    assert.fail(err);
  });
});