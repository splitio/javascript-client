'use strict';

var matcherTypes = require('../../../../lib/matchers/types');
var matcherFactory = require('../../../../lib/matchers');
var tape = require('tape');

tape('MATCHER SEGMENT / should return true ONLY when the segment is defined inside the segment storage', function (assert) {
  var segment = 'employees';

  var matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      has: function has(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return segment === segmentName;
      }
    }
  });

  assert.true(matcher(), 'segment found in mySegments list');
  assert.end();
});
//# sourceMappingURL=browser.spec.js.map