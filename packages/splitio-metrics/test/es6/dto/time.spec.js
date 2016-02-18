'use strict';

let tape = require('tape');
let TimeDTOFactory = require('../../../lib/dto/time');
let CollectorFactory = require('../../../lib/collector/sequential');

tape('TimeDTO', assert => {
  let latencies = CollectorFactory();
  let name = 'statKey';
  let dto = TimeDTOFactory('statKey', latencies);

  latencies.track(1);

  assert.true(
    JSON.stringify(dto) === JSON.stringify({name, latencies}),
    'should abstract the object to be send to the Time API'
  );
  assert.end();
});
