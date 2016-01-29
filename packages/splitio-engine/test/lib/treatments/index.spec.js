'use strict';

var tape = require('tape');
var Treatments = require('../../../lib/treatments');

tape('Treatments - parse 2 treatments', function (assert) {
  var t = Treatments.parse([{
    "treatment": "on",
    "size": 5
  }, {
    "treatment": "control",
    "size": 95
  }]);

  assert.deepEqual(t._ranges, [5, 100]);
  assert.deepEqual(t._treatments, ['on', 'control']);
  assert.end();
});

tape('Treatments - parse 1 treatment 100%:on', function (assert) {
  var t = Treatments.parse([{
    "treatment": "on",
    "size": 100
  }]);

  assert.deepEqual(t._ranges, [100]);
  assert.deepEqual(t._treatments, ['on']);
  assert.end();
});

tape('Treatments - parse 1 treatment 100%:off', function (assert) {
  var t = Treatments.parse([{
    "treatment": "control",
    "size": 100
  }]);

  assert.deepEqual(t._ranges, [100]);
  assert.deepEqual(t._treatments, ['control']);
  assert.end();
});

tape('Treatments - given a 50%:visa 50%:mastercard we should evaluate correctly', function (assert) {
  var t = Treatments.parse([{
    "treatment": "visa",
    "size": 50
  }, {
    "treatment": "mastercard",
    "size": 50
  }]);

  assert.equal(t.getTreatmentFor(10), 'visa', '10 => visa');
  assert.equal(t.getTreatmentFor(50), 'visa', '50 => visa');
  assert.equal(t.getTreatmentFor(51), 'mastercard', '51 => mastercard');
  assert.equal(t.getTreatmentFor(100), 'mastercard', '100 => mastercard');
  assert.end();
});
//# sourceMappingURL=index.spec.js.map