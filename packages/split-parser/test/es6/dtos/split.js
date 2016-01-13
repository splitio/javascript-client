'use strict';

var SplitDTO = require('split-parser/src/dtos/split');
var tape = require('tape');

var sampleServiceAnswer = require('./sampleServiceAnswer.json');

tape('if user is in segment employees 100%:on else if user is in segment all 5%:on 95%:off', function (assert) {
  let { splits: [ condition ] } = sampleServiceAnswer;

  let dto = SplitDTO.parse(condition);

  assert.true(dto.getSegments().has('employees'), 'employees should be present in segments');
  // assert.true(dto.getSegments().has('employees'), 'employees should be present in segments');

  assert.end();
});
