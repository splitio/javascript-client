'use strict';

let tape = require('tape');
let engine = require('../../../lib/engine');

let Treatments = require('../../../lib/treatments');
let treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'off',
  size: 95
}]);

tape('ENGINE / should evaluate always evaluate to false', assert => {
  let seed = 467569525;
  let key = 'aUfEsdPN1twuEjff9Sl';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(key, seed, treatmentsMock) === 'off',
    "treatment should be 'off'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('ENGINE / should evaluate always evaluate to true', assert => {
  let seed = 467569525;
  let key = 'fXvNwWFb7SXp';

  let startTime = Date.now();

  assert.true(
    engine.getTreatment(key, seed, treatmentsMock) === 'on',
    "treatment should be 'on'"
  );

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});
