'use strict';

var tape = require('tape');
var engine = require('../../../lib/engine');

var Treatments = require('../../../lib/treatments');
var treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'control',
  size: 95
}]);

tape('Engine should evaluate always evaluate to false', function (assert) {
  var seed = 467569525;
  var key = 'aUfEsdPN1twuEjff9Sl';

  var startTime = Date.now();

  assert.false(Treatments.RESERVED.isOn(engine.getTreatment(key, seed, treatmentsMock)), 'engine correctly evaluated to false');

  var endTime = Date.now();

  assert.comment('Evaluation takes ' + (endTime - startTime) / 1000 + ' seconds');
  assert.end();
});

tape('Engine should evaluate always evaluate to true', function (assert) {
  var seed = 467569525;
  var key = 'fXvNwWFb7SXp';

  var startTime = Date.now();

  assert.true(Treatments.RESERVED.isOn(engine.getTreatment(key, seed, treatmentsMock)), 'engine correctly evaluated to true');

  var endTime = Date.now();

  assert.comment('Evaluation takes ' + (endTime - startTime) / 1000 + ' seconds');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map