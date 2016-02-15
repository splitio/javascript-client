'use strict';

var matcherTypes = require('../../../lib/matchers/types');
var matcherFactory = require('../../../lib/matchers');
var tape = require('tape');

tape('MATCHER ALL / should always return true', function (assert) {

  var matcher = matcherFactory({
    type: matcherTypes.enum.ALL,
    value: undefined
  });

  assert.true(matcher('somekey'), '"somekey" should be true');
  assert.true(matcher('another key'), '"another key" should be true');
  assert.end();
});
//# sourceMappingURL=all.spec.js.map