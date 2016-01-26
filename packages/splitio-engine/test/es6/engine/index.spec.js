'use strict';

var tape = require('tape');
var engine = require('../../../lib/engine');
var partitionTypes = require('../../../lib/partitions/types');
var keys = require('./mocks/1000_keys_10_chart_length');

tape('The engine should evaluates always true', function (assert) {
  let partitions = new Map().set(partitionTypes.enum.ON, 100);
  let okCounter = 0;
  let failCounter = 0;

  let startTime = Date.now();

  for (let k of keys) {
    engine.isOn(k, 424344136, partitions) ? okCounter++ : failCounter++;
  }

  let endTime = Date.now();

  assert.true(okCounter === 1000, 'ALL keys should evaluate to true');
  assert.true(failCounter === 0, 'ANY keys should evaluate to false');
  assert.comment(`Evaluation takes ${(endTime - startTime) / 1000} seconds`);
  assert.end();
});

tape('The engine should evaluates half true and half false', function (assert) {
  let partitions = new Map().set(partitionTypes.enum.ON, 50);
  let okCounter = 0;
  let failCounter = 0;

  for (let k of keys) {
    if (engine.isOn(k, 424344136, partitions)) {
      okCounter++;
    } else {
      failCounter++;
    }
  }

  let total = keys.length;
  let percentageOk = okCounter * 100 / total;
  let percentageFail = failCounter * 100 / total;

  let inf = 50 - engine.TOLERANCE;
  let sup = 50 + engine.TOLERANCE;

  assert.true(inf <= percentageOk && percentageOk <= sup, `OK should be between(49.9, 50.1): ${percentageOk}`);
  assert.true(inf <= percentageFail && percentageFail <= sup, `FAIL should be between(49.9, 50.1): ${percentageFail}`);
  assert.end();
});
