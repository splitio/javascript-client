'use strict';

let tape = require('tape');
let TimeDTOFactory = require('../../../lib/dto/time');
let CollectorFactory = require('../../../lib/collector/sequential');

tape('TimeDTO', assert => {
  let collector = CollectorFactory();
  let name = 'statKey';
  let dto = TimeDTOFactory('statKey', collector);

  collector.track(1);

  assert.true(
    JSON.stringify(dto) === JSON.stringify({name, collector}),
    'should abstract the object to be send to the Time API'
  );
  assert.end();
});
