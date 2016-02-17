'use strict';

var tape = require('tape');
var TimeDTOFactory = require('../../../lib/dto/time');
var CollectorFactory = require('../../../lib/collector/sequential');

tape('TimeDTO', function (assert) {
  var collector = CollectorFactory();
  var name = 'statKey';
  var dto = TimeDTOFactory('statKey', collector);

  collector.track(1);

  assert.true(JSON.stringify(dto) === JSON.stringify({ name: name, collector: collector }), 'should abstract the object to be send to the Time API');
  assert.end();
});
//# sourceMappingURL=time.spec.js.map