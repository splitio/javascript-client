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
var engine = require('../../../lib/engine');

var Treatments = require('../../../lib/treatments');
var treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'off',
  size: 95
}]);

tape('ENGINE / should evaluate always evaluate to false', function (assert) {
  var seed = 467569525;
  var key = 'aUfEsdPN1twuEjff9Sl';

  var startTime = Date.now();

  assert.true(engine.getTreatment(key, seed, treatmentsMock) === 'off', "treatment should be 'off'");

  var endTime = Date.now();

  assert.comment('Evaluation takes ' + (endTime - startTime) / 1000 + ' seconds');
  assert.end();
});

tape('ENGINE / should evaluate always evaluate to true', function (assert) {
  var seed = 467569525;
  var key = 'fXvNwWFb7SXp';

  var startTime = Date.now();

  assert.true(engine.getTreatment(key, seed, treatmentsMock) === 'on', "treatment should be 'on'");

  var endTime = Date.now();

  assert.comment('Evaluation takes ' + (endTime - startTime) / 1000 + ' seconds');
  assert.end();
});