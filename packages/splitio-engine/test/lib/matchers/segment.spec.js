'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var matcherTypes = require('../../../lib/matchers/types');
var matcherFactory = require('../../../lib/matchers');
var tape = require('tape');

tape('MATCHER SEGMENT / should return true ONLY when the key is defined inside the segment', function (assert) {
  var segment = 'employees';

  var matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      get: function get(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return new _set2.default(['key']);
      }
    }
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another_key'), '"another key" should be false');
  assert.end();
});
//# sourceMappingURL=segment.spec.js.map