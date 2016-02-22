'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tape = require('tape');
var TimeDTOFactory = require('../../../lib/dto/time');
var CollectorFactory = require('../../../lib/collector/sequential');

tape('TimeDTO', function (assert) {
  var latencies = CollectorFactory();
  var name = 'statKey';
  var dto = TimeDTOFactory('statKey', latencies);

  latencies.track(1);

  assert.true((0, _stringify2.default)(dto) === (0, _stringify2.default)({ name: name, latencies: latencies }), 'should abstract the object to be send to the Time API');
  assert.end();
});
//# sourceMappingURL=Time.spec.js.map