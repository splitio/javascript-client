'use strict';

var transform = require('../../../lib/transforms/whitelist');
var tape = require('tape');

tape('a whitelist Array should be casted into a Set', function (assert) {
  var sample = ['u1', 'u2', 'u3'];

  var sampleSet = transform(sample);

  for (var item in sample) {
    if (sampleSet.has(item)) {
      assert.fail('Missing item ' + item);
    }
  }

  assert.ok(true, 'Everything looks fine');
  assert.end();
});
//# sourceMappingURL=whitelist.spec.js.map