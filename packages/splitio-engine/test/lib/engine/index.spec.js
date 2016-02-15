'use strict';

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
//# sourceMappingURL=index.spec.js.map