'use strict';

let tape = require('tape');
let engine = require('../../../lib/engine');

let Treatments = require('../../../lib/treatments');
let treatmentsMock = Treatments.parse([{
  treatment: 'on',
  size: 5
}, {
  treatment: 'control',
  size: 95
}]);

tape('Engine should evaluate always evaluate to false', assert => {
  let seed = 467569525;
  let key = 'aUfEsdPN1twuEjff9Sl';

  let startTime = Date.now();

  assert.false(engine.isOn(key, seed, treatmentsMock), 'engine correctly evaluated to false');

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('Engine should evaluate always evaluate to true', assert => {
  let seed = 467569525;
  let key = 'fXvNwWFb7SXp';

  let startTime = Date.now();

  assert.true(engine.isOn(key, seed, treatmentsMock), 'engine correctly evaluated to true');

  let endTime = Date.now();

  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});
